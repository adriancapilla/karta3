import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

// Lista cerrada: no incluye AGENTS, SDD, contratos, recursos o configuración.
const documents = new Set([
  'README.md',
  'docs/operacion/ENTREGA_MVP_TFM.md',
  'docs/operacion/GITHUB_Y_RECUPERACION.md'
]);
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', timeout: 15000 });
const isCommit = (sha) => typeof sha === 'string' && /^[a-f0-9]{40}$/.test(sha) && !/^0+$/.test(sha);
const onlyDocuments = (changes) => changes.length > 0 && changes.every(({ status, file }) =>
  ['A', 'M'].includes(status) && documents.has(file));

function changedFiles(base, head) {
  const fields = git('diff', '--name-status', '-z', '--no-renames', base, head, '--').split('\0');
  assert.equal(fields.pop(), '');
  assert.equal(fields.length % 2, 0);
  return fields.reduce((changes, field, index) => index % 2 === 0
    ? [...changes, { status: field, file: fields[index + 1] }] : changes, []);
}

function inspect(base, head) {
  assert.ok(isCommit(base) && isCommit(head));
  git('cat-file', '-e', `${base}^{commit}`);
  assert.equal(git('rev-parse', 'HEAD').trim(), head);
  const changes = changedFiles(base, head);
  const regular = onlyDocuments(changes) && changes.every(({ file }) =>
    git('ls-tree', head, '--', file).startsWith('100644 blob '));
  return { documentationOnly: regular, base, head, changes };
}

function scope() {
  let result = { documentationOnly: false, reason: 'Evento manual o no clasificable: recorrido actual.' };
  try {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const head = process.env.GITHUB_SHA;
    let base;
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      assert.equal(git('rev-parse', 'HEAD').trim(), event.pull_request.head.sha);
      assert.ok(isCommit(event.pull_request.base.sha) && isCommit(event.pull_request.head.sha));
      base = git('merge-base', event.pull_request.base.sha, event.pull_request.head.sha).trim();
      result = inspect(base, event.pull_request.head.sha);
    } else if (process.env.GITHUB_EVENT_NAME === 'push') {
      assert.equal(event.after, head);
      assert.ok(isCommit(event.before) && isCommit(head));
      git('merge-base', '--is-ancestor', event.before, head);
      result = inspect(event.before, head);
    }
  } catch {
    result = { documentationOnly: false, reason: 'Base, historial o diferencia inciertos: recorrido actual.' };
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `documentation_only=${result.documentationOnly}\nbase=${result.base || ''}\nhead=${result.head || ''}\n`);
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## Alcance completo del cambio\n\nRuta: **${result.documentationOnly ? 'documental ligera' : 'actual'}**.\n\n` +
    `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
  console.log(JSON.stringify(result));
}

const links = (text) => new Set([...text.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)].map((match) => match[1]));
const conflict = (text) => /^(?:<{7}|={7}|>{7})(?: |$)/m.test(text);

function check(base, head) {
  const result = inspect(base, head);
  assert.equal(result.documentationOnly, true, 'La comprobación ligera exige el cambio completo permitido.');
  git('diff', '--check', base, head, '--');
  let checkedLinks = 0;
  for (const { file, status } of result.changes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
    assert.equal(conflict(text), false, `Conflicto sin resolver: ${file}`);
    const oldLinks = links(status === 'A' ? '' : git('show', `${base}:${file}`));
    for (const link of links(text)) {
      if (oldLinks.has(link) || /^(?:https?:|mailto:|#)/i.test(link)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]));
      const relative = path.relative(process.cwd(), target);
      assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
        `Enlace local fuera del repositorio: ${file}: ${link}`);
      assert.ok(fs.existsSync(target), `Destino local inexistente: ${file}: ${link}`);
      checkedLinks++;
    }
  }
  const summary = `Documentación correcta: ${result.changes.length} archivos; UTF-8, conflictos, espacios y ` +
    `${checkedLinks} destinos locales nuevos comprobados. Sin instalación, compilación, navegador o imagen.\n`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

function selfTest() {
  const modified = (...files) => files.map((file) => ({ status: 'M', file }));
  const cases = [
    [[], false],
    [modified('README.md'), true],
    [modified(...documents), true],
    [modified('src/App.tsx'), false],
    [modified('src/App.css'), false],
    [modified('README.md', 'src/App.tsx'), false],
    [modified('src/App.tsx', 'README.md'), false],
    [modified('docs/sdd/PROCESO_SDD.md'), false],
    [modified('AGENTS.md'), false],
    [modified('.github/workflows/ci.yml'), false],
    [modified('README.md', 'package-lock.json'), false],
    [[{ status: 'D', file: 'README.md' }], false],
    [[{ status: 'T', file: 'README.md' }], false],
    [[{ status: 'R100', file: 'README.md' }], false],
    [modified('docs/operacion/../operacion/ENTREGA_MVP_TFM.md'), false]
  ];
  for (const [changes, expected] of cases) assert.equal(onlyDocuments(changes), expected, JSON.stringify(changes));
  assert.equal(isCommit('0'.repeat(40)), false);
  assert.equal(isCommit('refs/heads/main'), false);
  assert.equal(conflict('<<<<<<< HEAD\ntexto\n=======\notro\n>>>>>>> main'), true);
  assert.equal(conflict('# Guía\ntexto'), false);
  assert.deepEqual([...links('[Guía](docs/guia.md)')], ['docs/guia.md']);
  console.log(`Clasificador: ${cases.length} decisiones correctas, incluidas producto/visual/mixtas; validadores básicos correctos.`);
}

switch (process.argv[2]) {
  case 'scope': scope(); break;
  case 'check': check(process.argv[3], process.argv[4]); break;
  case 'self-test': selfTest(); break;
  default: throw new Error('Uso: documentation.mjs scope | check BASE HEAD | self-test');
}
