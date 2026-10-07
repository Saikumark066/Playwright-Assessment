import { test, expect } from '../../fixtures/test.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { EmployeePage } from '../../pages/EmployeePage.js';
import { ROUTES } from '../../utils/constants.js';
import { getBaseUrl } from '../../utils/environment.js';

// This RBAC test verifies the permission boundary between admin and ESS users.
// We use a real ESS user fixture to confirm the UI blocks access to employee management while the admin still sees the module.

test.describe('Role-based authorization', () => {
  test('Admin can access PIM while ESS cannot', { tag: '@rbac' }, async ({ browser, adminStorageState, essUser }) => {
    const adminContext = await browser.newContext({ baseURL: getBaseUrl(), storageState: adminStorageState });
    try {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(new URL(ROUTES.DASHBOARD, getBaseUrl()).toString());
      const adminEmployeePage = new EmployeePage(adminPage);
      await adminEmployeePage.verifyAdminNavigation();
    } finally {
      await adminContext.close();
    }

    const essContext = await browser.newContext({ baseURL: getBaseUrl() });
    try {
      const essPage = await essContext.newPage();
      const loginPage = new LoginPage(essPage);
      await loginPage.goto();
      await loginPage.login(essUser.username, essUser.password);
      await essPage.waitForURL(/\/dashboard\//);

      const essEmployeePage = new EmployeePage(essPage);
      await essEmployeePage.verifyEssCannotAccessPim();

      await essPage.goto(new URL(ROUTES.EMPLOYEE_LIST, getBaseUrl()).toString());
      await expect(essPage.getByRole('alert')).toBeVisible();
    } finally {
      await essContext.close();
    }
  });
});
