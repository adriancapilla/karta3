export type JsonError = { code: 'JSON_ENCODING' | 'JSON_SYNTAX' | 'JSON_DUPLICATE_KEY'; path: string; message: string };
export type JsonResult = { value?: unknown; errors: JsonError[] };

/** No se usa JSON.parse sobre objetos: sobrescribiría claves duplicadas. */
export function readStrictJson(bytes: Uint8Array): JsonResult {
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { return { errors: [{ code: 'JSON_ENCODING', path: '$', message: 'Se requiere UTF-8 válido.' }] }; }
  let offset = 0;
  const errors: JsonError[] = [];
  function location() {
    const lines = source.slice(0, offset).split('\n');
    return `posición ${offset}, línea ${lines.length}, columna ${lines.at(-1)!.length + 1}`;
  }
  function syntax(path: string): never {
    errors.push({ code: 'JSON_SYNTAX', path, message: `JSON no válido (${location()}).` });
    throw new SyntaxError();
  }
  function whitespace() { while (/[\x20\t\r\n]/.test(source[offset] ?? '\0')) offset++; }
  function string(path: string): string {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === '\\') offset++;
      else if (char === '"') {
        try { return JSON.parse(source.slice(start, offset)) as string; } catch { return syntax(path); }
      }
    }
    return syntax(path);
  }
  function value(path: string): unknown {
    whitespace();
    const char = source[offset];
    if (char === '"') return string(path);
    if (char === '{') {
      offset++; whitespace();
      const result: Record<string, unknown> = Object.create(null);
      if (source[offset] === '}') { offset++; return result; }
      while (offset < source.length) {
        if (source[offset] !== '"') return syntax(path);
        const key = string(path);
        const child = path === '$' ? key : `${path}.${key}`;
        whitespace();
        if (source[offset++] !== ':') return syntax(child);
        if (Object.hasOwn(result, key)) errors.push({ code: 'JSON_DUPLICATE_KEY', path: child, message: `Clave duplicada (${location()}).` });
        result[key] = value(child);
        whitespace();
        if (source[offset] === '}') { offset++; return result; }
        if (source[offset++] !== ',') return syntax(path);
        whitespace();
      }
      return syntax(path);
    }
    if (char === '[') {
      offset++; whitespace();
      const result: unknown[] = [];
      if (source[offset] === ']') { offset++; return result; }
      while (offset < source.length) {
        result.push(value(`${path}[${result.length}]`)); whitespace();
        if (source[offset] === ']') { offset++; return result; }
        if (source[offset++] !== ',') return syntax(path);
      }
      return syntax(path);
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(offset))?.[0];
    if (!token) return syntax(path);
    offset += token.length;
    return JSON.parse(token) as unknown;
  }
  try {
    const result = value('$'); whitespace();
    if (offset !== source.length) syntax('$');
    return errors.length ? { errors } : { value: result, errors };
  } catch {
    if (!errors.some((error) => error.code === 'JSON_SYNTAX')) errors.push({ code: 'JSON_SYNTAX', path: '$', message: 'JSON no analizable.' });
    return { errors };
  }
}
