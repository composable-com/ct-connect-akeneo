process.env.ENABLE_NEW_JSX_TRANSFORM = 'true';

/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
module.exports = {
  preset: '@commercetools-frontend/jest-preset-mc-app/typescript',
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageThreshold: {
    // Current coverage is around 19%. This is our starting point.
    // The goal is to incrementally increase this to 75% as more tests are added.
    global: {
      branches: 20, // Goal: 75%
      functions: 20, // Goal: 75%
      lines: 20, // Goal: 75%
      statements: 20, // Goal: 75%
    },
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/index.tsx',
    '!src/load-messages.ts',
    '!src/i18n/**',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/test-utils/**',
  ],
};
