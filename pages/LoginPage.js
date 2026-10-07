import { expect } from '@playwright/test';
import { getBaseUrl, getLoginCredentials } from '../utils/environment.js';
import { ROUTES, TIMEOUTS } from '../utils/constants.js';

// This page object encapsulates the auth screen and login assertions.
// We use it so all login tests can share the same selectors and success/failure checks instead of repeating raw browser steps.
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.invalidCredentialsMessage = page.getByText('Invalid credentials');
    this.requiredFieldErrors = page.locator('.oxd-input-field-error-message');
  }

  // Opens the login page from the configured base URL.
  // We centralize this navigation because every auth test needs to start from the same route.
  async goto() {
    await this.page.goto(new URL(ROUTES.LOGIN, getBaseUrl()).toString());
  }

  // Fills the credentials form and submits the login request.
  // This helper keeps the login flow reusable for both valid and invalid credentials scenarios.
  async login(username, password) {
    const credentials = username === undefined && password === undefined
      ? getLoginCredentials()
      : { username, password };
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.loginButton.click();
  }

  // Verifies the login screen is rendered before we exercise any authentication actions.
  // The smoke test depends on this state so it fails early and clearly when the login page is broken.
  async verifyLoginPage() {
    await expect(this.loginButton).toBeVisible();
  }

  // Confirms that a successful login reaches the dashboard and not an error state.
  // We poll the page URL because the redirect can happen a moment after form submission.
  async verifyLoginSuccess() {
    let state;
    await expect.poll(async () => {
      if (/\/dashboard\//.test(this.page.url())) {
        state = 'dashboard';
        return state;
      }
      if (await this.invalidCredentialsMessage.isVisible()) {
        state = 'invalid-credentials';
        return state;
      }
      return 'pending';
    }, {
      timeout: TIMEOUTS.navigation,
      message: 'Expected login to reach the dashboard or show an invalid-credentials message.',
    }).not.toBe('pending');

    if (state === 'invalid-credentials') {
      throw new Error('Admin login was rejected. Check the configured credentials for the selected TEST_ENV.');
    }
    await expect(this.page).toHaveURL(/\/dashboard\//);
  }

  // Verifies the app rejects invalid credentials with the standard error banner.
  // We use this in negative login tests to confirm the server validates user input.
  async verifyLoginFailure() {
    await expect(this.invalidCredentialsMessage).toBeVisible();
  }

  // Verifies the browser shows field-level validation when credentials are blank.
  // This catches client-side validation regressions before deeper auth scenarios run.
  async verifyLoginFailureWithEmptyCredentials() {
    await expect(this.requiredFieldErrors.first()).toBeVisible();
    await expect(this.requiredFieldErrors).toHaveCount(2);
  }
}
