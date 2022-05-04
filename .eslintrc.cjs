module.exports = {
  env: {
    browser: true,
    node: true,
    mocha: true
  },
  extends: ['eslint:recommended', 'standard', 'google', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  globals: {
    describe: true,
    beforeEach: true,
    afterEach: true,
    it: true,
    expect: true,
    sinon: true,
    globalThis: true,
  },
};
