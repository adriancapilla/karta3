import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'dist-server/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  { files: ['**/*.{ts,tsx,mjs}'], languageOptions: { globals: { process: 'readonly', window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly' } } }
);
