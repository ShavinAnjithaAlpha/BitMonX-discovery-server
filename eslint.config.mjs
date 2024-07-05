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
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-constant-condition': 'off',
      'no-prototype-builtins': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-unsafe-negation': 'off',
      'no-unsafe-assignment': 'off',
      'no-unsafe-member-access': 'off',
      'no-unsafe-call': 'off',
      'no-unsafe-return': 'off',
      'no-unsafe-regex': 'off',
      'no-unsafe-argument': 'off',
      'no-unsafe-iteration': 'off',
      'no-unsafe-finally': 'off',
      'no-unsafe-creation': 'off',
      'no-unsafe-optional-properties': 'off',
      'no-unsafe-assign': 'off',
      'no-unsafe-math': 'off',
    },
  },
];
