module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['vaadin', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
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
