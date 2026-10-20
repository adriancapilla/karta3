import { expect, it } from 'vitest';
import path from 'node:path';
import { statisticsLocation, statisticsMode } from './statistics.js';
it('B21: matriz entorno/tráfico cerrada; Pruebas preparada por defecto, test explícito y sin ampliar producción', () => {
  expect(statisticsMode(undefined, 'pruebas')).toBe('aggregate'); expect(statisticsMode(undefined, undefined)).toBe('off');
  expect(statisticsMode(undefined, 'test')).toBe('off'); expect(statisticsMode(undefined, 'production')).toBe('off');
  expect(statisticsMode('off', 'pruebas')).toBe('off'); expect(statisticsMode('synthetic', 'test')).toBe('synthetic');
  for (const pair of [['human', 'pruebas'], ['aggregate', 'production'], ['synthetic', 'pruebas'], ['aggregate', 'test']]) expect(statisticsMode(...pair as [string, string])).toBeUndefined();
  const location = statisticsLocation('test', path.resolve('statistics-data'), 'SYNTHETIC');
  expect(location.file).toBe(path.resolve('statistics-data/test/synthetic/agg-daily-v1.sqlite'));
  for (const directory of ['dist', 'DiSt', 'public', 'barajas', 'SRC', 'dist-server']) expect(() => statisticsLocation('test', path.resolve(directory))).toThrow('INVALID_FILTER');
});
