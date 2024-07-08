import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.es2020 },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-constant-condition': 'error',
      'no-prototype-builtins': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-unsafe-negation': 'error',
      'no-unsafe-member-access': 'off',
      'no-unsafe-call': 'off',
      'no-unsafe-regex': 'off',
      'no-unsafe-argument': 'off',
      'no-unsafe-finally': 'error',
      'no-unsafe-optional-properties': 'off',
    },
  },
];
