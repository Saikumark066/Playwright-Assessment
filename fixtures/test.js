import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from '../pages/LoginPage.js';
import { EmployeePage } from '../pages/EmployeePage.js';
import { EmployeeApi } from '../api/EmployeeApi.js';
import { UserApi } from '../api/UserApi.js';
import { getBaseUrl, getLoginCredentials } from '../utils/environment.js';
import { buildEmployee, buildEssUser } from '../utils/testData.js';
import { TIMEOUTS } from '../utils/constants.js';

// This Playwright fixture factory creates the reusable browser, API, and lifecycle helpers used in all tests.
// We centralize setup here so each spec gets authenticated sessions and clean test data without duplicating boilerplate.
export const test = base.extend({
  // Creates a worker-scoped admin storage state so all tests can reuse the same logged-in browser session.
  adminStorageState: [async ({ browser }, use, workerInfo) => {
    const authDir = path.join(workerInfo.project.outputDir, 'auth');
    fs.mkdirSync(authDir, { recursive: true });
    const storagePath = path.join(authDir, `admin-${workerInfo.workerIndex}.json`);

    const context = await browser.newContext({ baseURL: getBaseUrl() });
    try {
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      const credentials = getLoginCredentials();
      await loginPage.goto();
      await loginPage.login(credentials.username, credentials.password);
      await loginPage.verifyLoginSuccess();
      await context.storageState({ path: storagePath });
    } finally {
      await context.close();
    }
    await use(storagePath);
  }, { scope: 'worker' }],

  // Reuses the admin storage state to open a page that is already authenticated.
  // We do this to avoid logging in on every test and to keep the suite fast and consistent.
  authenticatedPage: async ({ browser, adminStorageState }, use) => {
    const context = await browser.newContext({
      baseURL: getBaseUrl(),
      storageState: adminStorageState,
    });
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await context.close();
    }
  },

  // Provides the UI page object for employee pages without repeating page initialization in each test.
  employeePage: async ({ authenticatedPage }, use) => {
    await use(new EmployeePage(authenticatedPage));
  },

  // Provides a browser API context that keeps the same authenticated session as the UI tests.
  api: async ({ playwright, adminStorageState }, use) => {
    const request = await playwright.request.newContext({
      baseURL: getBaseUrl(),
      storageState: adminStorageState,
      timeout: TIMEOUTS.api,
    });
    try {
      await use(request);
    } finally {
      await request.dispose();
    }
  },

  // Exposes the employee API client for CRUD and verification checks.
  employeeApi: async ({ api }, use) => {
    await use(new EmployeeApi(api));
  },

  // Exposes the admin user API client for RBAC and role-based fixtures.
  userApi: async ({ api }, use) => {
    await use(new UserApi(api));
  },

  // Creates a real employee record for a test and deletes it during teardown.
  employee: async ({ employeeApi }, use) => {
    const data = buildEmployee();
    const created = await employeeApi.createEmployee(data);
    const empNumber = created.empNumber;
    try {
      await use({ ...data, empNumber });
    } finally {
      const existing = await employeeApi.getEmployeeById(data.employeeId);
      if (existing?.empNumber) await employeeApi.deleteEmployee(existing.empNumber);
    }
  },

  // Creates a temporary ESS user and employee so RBAC tests can validate permission boundaries.
  essUser: async ({ employeeApi, userApi }, use) => {
    const employee = buildEmployee({ firstName: 'ESS', lastName: 'User' });
    const createdEmployee = await employeeApi.createEmployee(employee);
    let userId;
    try {
      const essRoleId = await userApi.getEssRoleId();
      const user = buildEssUser(createdEmployee.empNumber, essRoleId);
      const createdUser = await userApi.createUser(user);
      userId = createdUser.id;

      await use({ ...user, userId, employee: { ...employee, empNumber: createdEmployee.empNumber } });
    } finally {
      const cleanup = [];
      if (userId) cleanup.push(() => userApi.deleteUser(userId));
      cleanup.push(() => employeeApi.deleteEmployee(createdEmployee.empNumber));
      const results = await Promise.allSettled(cleanup.map((remove) => remove()));
      const errors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);
      if (errors.length) throw new AggregateError(errors, 'Failed to clean up ESS fixture data.');
    }
  },
});

export { expect };
