import { test } from '../../fixtures/test.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { getLoginCredentials } from '../../utils/environment.js';
import { TEST_VALUES } from '../../utils/constants.js';

// Authentication tests cover the login flow and verify that the app rejects invalid or empty credentials.
// We keep these checks focused on core access control so it is easy to tell whether the app is allowing unauthorized login.

test.describe('Authentication', () => {
  // Smoke test: verifies the login page loads and exposes the sign-in controls.
  // This is intentionally lightweight so it fails fast when the app is unavailable or the login route is broken.
  test('login page loads', { tag: ['@smoke', '@parallel-safe'] }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.verifyLoginPage();
  });

  // Validates the expected happy path for an admin login.
  // We use the configured credentials here to confirm a real authenticated session can be created.
  test('Admin login succeeds', { tag: '@auth' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const credentials = getLoginCredentials();
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.verifyLoginSuccess();
  });

  // Ensures invalid credentials are rejected instead of granting access.
  // This negative case confirms the authentication layer is enforcing password validation.
  test('invalid password is rejected', { tag: '@negative' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const credentials = getLoginCredentials();
    await loginPage.goto();
    await loginPage.login(credentials.username, TEST_VALUES.invalidPassword);
    await loginPage.verifyLoginFailure();
  });

  // Confirms the form blocks blank input before submitting a login request.
  // We check the field-level validation here to catch frontend validation regressions before deeper tests run.
  test('empty credentials are rejected', { tag: '@negative' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', '');
    await loginPage.verifyLoginFailureWithEmptyCredentials();
  });
});
