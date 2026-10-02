import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const productionRoots = ['server', 'src', 'shared'];
const sourceExtension = /\.(?:ts|tsx|js|jsx|mjs)$/;
const testFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const assetExtension = /\.(?:css|json|svg|png|jpg|jpeg|webp)$/;

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return entry.isFile() && sourceExtension.test(entry.name) && !testFile.test(entry.name) && !entry.name.endsWith('.d.ts') ? [target] : [];
  });
}

function layer(file, root) {
  const parts = path.relative(root, file).split(path.sep);
  if (parts[0] === 'src') return 'client';
  if (parts[0] === 'shared') return 'contracts';
  if (parts[0] === 'tools') return 'tool';
  if (parts[0] === 'server') {
    if (parts[1] === 'main.ts' || parts[1] === 'composition') return 'composition';
    if (parts[1] === 'application') return 'application';
    if (parts[1] === 'infrastructure') return 'infrastructure';
    if (parts[1] === 'domain') return 'domain';
  }
  return 'unknown';
}

const allowed = {
  domain: new Set(['domain']),
  application: new Set(['application', 'domain', 'contracts']),
  infrastructure: new Set(['infrastructure', 'application', 'domain', 'contracts']),
  composition: new Set(['composition', 'infrastructure', 'application', 'domain', 'contracts']),
  client: new Set(['client', 'contracts']),
  contracts: new Set(['contracts']),
  tool: new Set(['composition'])
};

function compilerOptions(root, file) {
  const config = path.join(root, layer(file, root) === 'client' ? 'tsconfig.client.json' : 'tsconfig.server.json');
  if (fs.existsSync(config)) {
    const read = ts.readConfigFile(config, ts.sys.readFile);
    if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
    return ts.parseJsonConfigFileContent(read.config, ts.sys, root).options;
  }
  return { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext };
}

function moduleSpecifiers(source) {
  const specs = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specs.push(node.moduleSpecifier.text);
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      specs.push(node.argument.literal.text);
    }
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      specs.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specs;
}

export function scanProject(root) {
  const absoluteRoot = path.resolve(root);
  const toolsRoot = path.join(absoluteRoot, 'tools');
  const commands = fs.existsSync(toolsRoot) ? fs.readdirSync(toolsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && sourceExtension.test(entry.name) && !testFile.test(entry.name))
    .map((entry) => path.join(toolsRoot, entry.name)) : [];
  const files = [...productionRoots.flatMap((name) => sourceFiles(path.join(absoluteRoot, name))), ...commands].map((file) => path.resolve(file));
  const fileSet = new Set(files);
  const edges = new Map(files.map((file) => [file, []]));
  const violations = [];

  for (const file of files) {
    const from = layer(file, absoluteRoot);
    if (from === 'unknown') {
      violations.push(`${path.relative(absoluteRoot, file)}: capa no reconocida`);
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const options = compilerOptions(absoluteRoot, file);
    for (const specifier of moduleSpecifiers(source)) {
      const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule?.resolvedFileName;
      if (!resolved) {
        const alias = Object.keys(options.paths ?? {}).some((pattern) => {
          const [prefix, suffix = ''] = pattern.split('*');
          return specifier.startsWith(prefix) && specifier.endsWith(suffix);
        });
        if ((specifier.startsWith('.') || alias) && !assetExtension.test(specifier)) {
          violations.push(`${path.relative(absoluteRoot, file)}: importación sin resolver ${specifier}`);
        } else if (!specifier.startsWith('.') && !['client', 'infrastructure', 'composition', 'tool'].includes(from)) {
          violations.push(`${path.relative(absoluteRoot, file)}: dependencia externa prohibida ${specifier}`);
        }
        continue;
      }
      const target = path.resolve(resolved);
      if (!fileSet.has(target)) {
        if (target.startsWith(`${absoluteRoot}${path.sep}`) && !target.includes(`${path.sep}node_modules${path.sep}`) && !assetExtension.test(target)) {
          violations.push(`${path.relative(absoluteRoot, file)}: destino fuera del código de producción ${specifier}`);
        } else if (!target.startsWith(`${absoluteRoot}${path.sep}`) && !target.includes(`${path.sep}node_modules${path.sep}`)) {
          violations.push(`${path.relative(absoluteRoot, file)}: importación fuera del proyecto ${specifier}`);
        } else if ((from === 'application' || from === 'domain' || from === 'contracts') && target.includes(`${path.sep}node_modules${path.sep}`)) {
          violations.push(`${path.relative(absoluteRoot, file)}: dependencia externa prohibida ${specifier}`);
        }
        continue;
      }
      const to = layer(target, absoluteRoot);
      if (!allowed[from].has(to)) {
        violations.push(`${path.relative(absoluteRoot, file)} → ${path.relative(absoluteRoot, target)}: ${from} no puede importar ${to}`);
      }
      edges.get(file).push(target);
    }
  }

  const state = new Map();
  const stack = [];
  const cycles = new Set();
  function visit(file) {
    state.set(file, 1);
    stack.push(file);
    for (const target of edges.get(file) ?? []) {
      if (state.get(target) === 1) {
        const cycle = [...stack.slice(stack.indexOf(target)), target].map((part) => path.relative(absoluteRoot, part)).join(' → ');
        cycles.add(`ciclo: ${cycle}`);
      } else if (!state.has(target)) visit(target);
    }
    stack.pop();
    state.set(file, 2);
  }
  for (const file of files) if (!state.has(file)) visit(file);
  return { files: files.length, violations: [...violations, ...cycles] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = scanProject(process.cwd());
  if (result.violations.length) {
    for (const violation of result.violations) console.error(violation);
    process.exitCode = 1;
  } else {
    console.log(`Arquitectura: ${result.files} módulos revisados, sin imports prohibidos ni ciclos.`);
  }
}
