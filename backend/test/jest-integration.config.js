module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  coverageDirectory: './coverage-integration',
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!../src/**/*.spec.ts',
    '!../src/**/index.ts',
    '!../src/main.ts',
  ],
};
