# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.js >> CI retry demo should recover from a transient failure
- Location: tests\login.spec.js:46:5

# Error details

```
Error: Intentional first-attempt failure to verify CI retries.
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { LoginPage } from '../pages/LoginPage';
  3  | 
  4  | let loginPage;
  5  | 
  6  | // Test suite for OrangeHRM login functionality before each test, we navigate to the login page and initialize the LoginPage object.
  7  | //  After each test, we close the page to ensure a clean state for the next test.
  8  | test.beforeEach(async ({ page }) => {
  9  |   loginPage = new LoginPage(page);
  10 |   await loginPage.goto();
  11 | });
  12 | 
  13 | test.afterEach(async ({ page }) => {
  14 |   await page.close();
  15 | });
  16 | 
  17 | 
  18 | test('OrangeHRM login page successfully using environment variables', async () => {
  19 |   await loginPage.verifyLoginPage();
  20 |   await loginPage.loginsucesss();
  21 | });
  22 |   
  23 | // Test case for OrangeHRM login page loading.
  24 | test('OrangeHRM login page should load successfully', async () => {
  25 |   await loginPage.verifyLoginPage();
  26 | });
  27 | 
  28 | // Test case for OrangeHRM login success
  29 | test('OrangeHRM Admin login Success', async () => {
  30 |   await loginPage.login('Admin', 'admin123');
  31 |   await loginPage.verifyLoginSuccess();
  32 | });
  33 | 
  34 | // Test case for OrangeHRM login failure
  35 | test('OrangeHRM Admin login Failure', async () => {
  36 |   await loginPage.login('Admin', 'wrongpassword');
  37 |   await loginPage.verifyLoginFailure();
  38 | });
  39 | 
  40 | //Test case for OrangeHRM empty credentials.
  41 | test('OrangeHRM Admin login Failure with empty credentials', async () => {
  42 |   await loginPage.login('', '');
  43 |   await loginPage.verifyLoginFailureWithEmptyCredentials();
  44 | });
  45 | 
  46 | test('CI retry demo should recover from a transient failure', async ({}, testInfo) => {
  47 |   test.skip(!process.env.CI, 'This retry demonstration is intended for CI only.');
  48 | 
  49 |   if (testInfo.retry === 0) {
> 50 |     throw new Error('Intentional first-attempt failure to verify CI retries.');
     |           ^ Error: Intentional first-attempt failure to verify CI retries.
  51 |   }
  52 | 
  53 |   expect(testInfo.retry).toBeGreaterThan(0);
  54 | });
  55 | 
```