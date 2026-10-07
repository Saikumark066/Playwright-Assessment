import { defineConfig } from '@playwright/test';
import { getBaseUrl, getWorkers, getEnvironmentName } from './utils/environment.js';
import { TIMEOUTS } from './utils/constants.js';

// This config sets the default Playwright behavior for the entire project.
// We centralize the browser, timeout, and reporting settings here so every test run starts from a consistent execution environment.
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: getWorkers(),
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['blob'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: getBaseUrl(),
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
  },
  metadata: { environment: getEnvironmentName() },
});
