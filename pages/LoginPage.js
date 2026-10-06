import { expect } from "@playwright/test";
import { getBaseUrl, getLoginCredentials } from "../utils/environment";

export class LoginPage {
  constructor(page) {
    this.page = page;

    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');

    this.invalidCredentialsMessage = page.getByText("Invalid credentials");
    this.requiredFieldError = page.getByText("UsernameRequired");
  }

  async goto() {
    await this.page.goto(new URL("auth/login", getBaseUrl()).toString());
  }

  async login(username, password) {
    const credentials =
      username === undefined && password === undefined
        ? getLoginCredentials()
        : { username, password };

    await this.usernameInput.waitFor({ state: "visible" });
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.loginButton.click();
  }

  async loginSuccess(username, password) {
    await this.login(username, password);
  }

  async loginsucesss(username, password) {
    await this.loginSuccess(username, password);
  }

  async verifyLoginPage() {
    await expect.soft(this.loginButton).toBeVisible();
  }

  async verifyLoginSuccess() {
    await this.page.waitForURL(/\/dashboard\//, { timeout: 20000 });
    await expect.soft(this.page.getByRole("link", { name: "PIM" })).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect.soft(this.invalidCredentialsMessage).toBeVisible();
  }

  async verifyLoginFailureWithEmptyCredentials() {
    await expect.soft(this.requiredFieldError).toBeVisible();
  }
}
