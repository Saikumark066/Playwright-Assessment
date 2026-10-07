// Shared UI and API settings used across the suite.
// We group timeouts and route constants here so tests can reuse the same expectations instead of hard-coding values in each spec.
export const TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  expect: 10_000,
  test: 60_000,
  api: 20_000,
};

// Common test inputs kept in one place to make negative tests easy to read and maintain.
export const TEST_VALUES = {
  invalidPassword: 'Invalid!Password@2026',
};

// Route constants avoid repeating relative URLs and reduce the chance of typos across page navigation and fixture setup.
export const ROUTES = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  DASHBOARD: 'dashboard/index',
  EMPLOYEE_LIST: 'pim/viewEmployeeList',
  ADD_EMPLOYEE: 'pim/addEmployee',
};
