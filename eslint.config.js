import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'dist-server/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  { files: ['**/*.{ts,tsx,mjs}'], languageOptions: { globals: { process: 'readonly', window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly' } } },
  // Maquetas recibidas: scripts clásicos comparten sus datos y los módulos miden el DOM en page.evaluate.
  { files: ['docs/diseno/valor-atributo-propuestas/*.{js,mjs}'], languageOptions: { globals: {
    URLSearchParams: 'readonly', location: 'readonly', document: 'readonly', window: 'readonly',
    structuredClone: 'readonly', getComputedStyle: 'readonly', ResizeObserver: 'readonly',
    requestAnimationFrame: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly', scrollY: 'readonly',
    SAMPLES: 'readonly', COMPLEMENT_METADATA: 'readonly'
  } } },
  { files: ['docs/diseno/valor-atributo-propuestas/muestras.js', 'docs/diseno/valor-atributo-propuestas/complemento-metadata.js'],
    languageOptions: { sourceType: 'script', globals: { SAMPLES: 'off', COMPLEMENT_METADATA: 'off' } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^(SAMPLES|COMPLEMENT_METADATA)$' }] } }
);
