import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

let loginPage;

// Test suite for OrangeHRM login functionality before each test, we navigate to the login page and initialize the LoginPage object.
//  After each test, we close the page to ensure a clean state for the next test.
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});

test.afterEach(async ({ page }) => {
  await page.close();
});


test('OrangeHRM login page successfully using environment variables', async () => {
  await loginPage.verifyLoginPage();
  await loginPage.loginsucesss();
});
  
// Test case for OrangeHRM login page loading.
test('OrangeHRM login page should load successfully', async () => {
  await loginPage.verifyLoginPage();
});

// Test case for OrangeHRM login success
test('OrangeHRM Admin login Success', async () => {
  await loginPage.login('Admin', 'admin123');
  await loginPage.verifyLoginSuccess();
});

// Test case for OrangeHRM login failure
test('OrangeHRM Admin login Failure', async () => {
  await loginPage.login('Admin', 'wrongpassword');
  await loginPage.verifyLoginFailure();
});

//Test case for OrangeHRM empty credentials.
test('OrangeHRM Admin login Failure with empty credentials', async () => {
  await loginPage.login('', '');
  await loginPage.verifyLoginFailureWithEmptyCredentials();
});

test('CI retry demo should recover from a transient failure', async ({}, testInfo) => {
  // Keep the deliberate failure out of local test runs.
  test.skip(!process.env.CI, 'This retry demonstration is intended for CI only.');

  // Fail once so Playwright exercises CI retries and reports the test as flaky.
  if (testInfo.retry === 0) {
    throw new Error('Intentional first-attempt failure to verify CI retries.');
  }

  expect(testInfo.retry).toBeGreaterThan(0);
});
