
const { defineConfig } = require('@playwright/test');
const { getBaseUrl } = require('./utils/environment').default;
require('dotenv').config();

const requestedWorkers = process.env.WORKERS
  ? Number(process.env.WORKERS)
  : 1;

if (!Number.isInteger(requestedWorkers) || requestedWorkers < 1) {
  throw new Error('WORKERS must be a positive integer.');
}

module.exports = defineConfig({
  testDir: './tests',

  // Keep the OrangeHRM demo app stable by avoiding concurrent writes across tests.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  // Retries expose transient failures in CI; local runs surface them immediately.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : requestedWorkers,

  // Test reports
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }]
  ],

  // Shared browser settings
  use: {
    baseURL: getBaseUrl(),

    browserName: 'chromium',
    headless: true,

    // Capture debugging evidence
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',

    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  // Test timeouts
  timeout: 30000,

  expect: {
    timeout: 10000
  }
});