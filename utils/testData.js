import { randomBytes } from 'node:crypto';

// This helper generates a unique timestamp-based suffix for IDs used in employee and ESS user fixtures.
// We use it so tests can create realistic data without collisions even when they run in parallel.
function suffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// Creates a unique employee identifier that stays short enough for OrangeHRM form validation.
// We use it because the app expects employee IDs to be unique and test-safe across retries.
export function createUniqueEmployeeId() {
  return suffix().slice(-9);
}

// Builds a default employee payload used by all CRUD and lifecycle tests.
// Centralizing the data shape here keeps every test consistent while allowing overrides for specific requirements.
export function buildEmployee(overrides = {}) {
  return {
    firstName: 'Auto',
    middleName: 'Test',
    lastName: 'Employee',
    employeeId: createUniqueEmployeeId(),
    ...overrides,
  };
}

// Builds a temporary ESS user for RBAC tests and permission boundary checks.
// We create a password and username in one place so keep the test fixture logic isolated and reusable.
export function buildEssUser(employeeId, userRoleId, overrides = {}) {
  const id = suffix().slice(-8);
  const password = process.env[`${(process.env.TEST_ENV || 'demo').toUpperCase()}_ESS_PASSWORD`]
    || process.env.ESS_PASSWORD
    || `${randomBytes(18).toString('base64url')}Aa1!`;

  return {
    username: `ess_${id}`,
    password,
    status: true,
    userRoleId,
    empNumber: Number(employeeId),
    ...overrides,
  };
}
