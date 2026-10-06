import { expect } from '@playwright/test';
import 'dotenv/config';

export class LoginPage {
  constructor(page) {
    this.page = page;
    // Login form
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Error messages
    this.InvalidCredentials = page.getByText('Invalid credentials');
    this.Required = page.getByText('UsernameRequired');
  }

  // Navigate to the login page
  async goto() {
    const baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/';
    await this.page.goto(new URL('auth/login', baseUrl).toString());
  }

  // Perform login action
  async login(username = process.env.USERNAME || 'Admin', password = process.env.PASSWORD || 'admin123') {
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginsucesss(username = process.env.USERNAME || 'Admin', password = process.env.PASSWORD || 'admin123') {
    await this.login(username, password);
  }


  // Verify the login page is loaded
  async verifyLoginPage() {
    await expect(this.loginButton).toBeVisible();
  }

  // Verify successful login by checking for the presence of the PIM link
  async verifyLoginSuccess() {
    await expect(this.page.getByRole('link', { name: 'PIM' })).toBeVisible();
  }

  // Verify login failure by checking for the presence of the Invalid credentials message
  async verifyLoginFailure() {
    await expect(this.InvalidCredentials).toBeVisible();
  }

  // Verify login failure with empty credentials by checking for the presence of the Required message
  async verifyLoginFailureWithEmptyCredentials() {
    await expect(this.Required).toBeVisible();
  }
}
