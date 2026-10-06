
const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',

  // Run independent tests in parallel
  fullyParallel: false,

  // Prevent test.only from being committed in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Use a controlled number of workers in CI
  workers: process.env.CI ? 2 : undefined,

  // Test reports
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }]
  ],

  // Shared browser settings
  use: {
    baseURL:
      process.env.BASE_URL ||
      'https://opensource-demo.orangehrmlive.com/web/index.php/',

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