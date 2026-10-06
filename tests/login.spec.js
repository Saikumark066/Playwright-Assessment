import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

let loginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});

test("OrangeHRM login page works with environment variables @smoke @auth", async () => {
  await loginPage.verifyLoginPage();
  await loginPage.loginSuccess();
  await loginPage.verifyLoginSuccess();
});

test("OrangeHRM login page should load successfully @smoke @parallel-safe", async () => {
  await loginPage.verifyLoginPage();
});

test("OrangeHRM Admin login succeeds @auth", async () => {
  await loginPage.login();
  await loginPage.verifyLoginSuccess();
});

test("OrangeHRM Admin login fails with an invalid password @negative", async () => {
  await loginPage.login("Admin", "wrongpassword");
  await loginPage.verifyLoginFailure();
});

test("OrangeHRM Admin login fails with empty credentials @negative", async () => {
  await loginPage.login("", "");
  await loginPage.verifyLoginFailureWithEmptyCredentials();
});

test("CI retry demo should recover from a transient failure @ci-retry", async ({}, testInfo) => {
  test.skip(
    !process.env.CI,
    "This retry demonstration is intended for CI only.",
  );

  if (testInfo.retry === 0) {
    throw new Error("Intentional first-attempt failure to verify CI retries.");
  }

  expect.soft(testInfo.retry).toBeGreaterThan(0);
});
