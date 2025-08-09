module.exports = {
  displayName: 'integration',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/../setupTests.js'],
  testMatch: ['<rootDir>/integration/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'] }],
  },
};