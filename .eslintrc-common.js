module.exports = {
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      'vars': 'all',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_'
    }],
    'prefer-template': 'error',
    'no-trailing-spaces': 2,
    'eol-last': ['error', 'always'],
    'space-before-function-paren': ['error', {
       'anonymous': 'never',
       'named': 'never',
       'asyncArrow': 'always'
    }],
    'keyword-spacing': 'error',
    'max-len': ['error', {
      'code': 128,
      'ignoreUrls': true,
      'ignoreStrings': true
    }]
  }
}
