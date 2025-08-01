module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  collectCoverageFrom: ['**/*.{js,jsx}', '!**/node_modules/**', '!**/tests/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['./tests/setupTests.js', './tests/jest.setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
};
