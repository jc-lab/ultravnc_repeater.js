module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2016,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended'
  ],
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    '@typescript-eslint/indent': ['error', 2, {'SwitchCase': 0}],
    'space-before-blocks': ['error', 'always'],
    'object-curly-newline': 'off',
    'keyword-spacing': ['error', {before: true, after: true}],
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'no-fallthrough': 'off',
    'no-constant-condition': 'off'
  }
};
