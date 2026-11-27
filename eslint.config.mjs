import js from '@eslint/js';
import globals from 'globals';

const regrasComuns = {
  'no-var': 'error',
  'prefer-const': 'error',
  eqeqeq: ['error', 'smart'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-shadow': 'warn',
  'object-shorthand': 'warn',
  'prefer-arrow-callback': 'warn',
  'no-unused-vars': ['error', { args: 'none' }]
};

const appsScript = ['HtmlService', 'SpreadsheetApp', 'LockService', 'PropertiesService', 'Utilities', 'Session'];

export default [
  js.configs.recommended,
  {
    files: ['fonte/app.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, google: 'readonly' } },
    rules: regrasComuns
  },
  {
    files: ['Code.gs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: Object.fromEntries(appsScript.map((nome) => [nome, 'readonly']))
    },
    rules: { ...regrasComuns, 'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^(doGet|carregarDados|salvarDados|onEdit)$' }] }
  },
  {
    files: ['testes/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
    rules: regrasComuns
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: regrasComuns
  }
];
