import { test, expect } from '../../fixtures/test.js';
import { newEmployee, updatedEmployee } from '../../data/employeeData.js';

// This suite verifies the employee REST API contract end-to-end.
// The goals are to confirm creation, lookup, update, and deletion all produce stable data that matches the expected employee schema.

test.describe('Employee API', () => {
  // Creates an employee via the API and immediately reads it back by empNumber.
  // This confirms the create call persists the same employeeId and returns a valid record shape.
  test('API creates and reads an employee by employee ID', { tag: ['@api', '@parallel-safe'] }, async ({ employeeApi }) => {
    const employee = newEmployee({ firstName: 'Api', lastName: 'Create' });
    const created = await employeeApi.createEmployee(employee);

    try {
      expect(created.firstName).toBe(employee.firstName);
      expect(created.lastName).toBe(employee.lastName);
      expect(String(created.employeeId)).toBe(String(employee.employeeId));

      const fetched = await employeeApi.getEmployeeByNumber(created.empNumber);
      expect(fetched.employeeId).toBe(employee.employeeId);
    } finally {
      await employeeApi.deleteEmployee(created.empNumber);
    }
  });

  // Updates personal details through the API and verifies the saved record includes the new values.
  // This catches payload mismatches between the update endpoint and the data returned after persistence.
  test('API updates an employee personal detail', { tag: '@api' }, async ({ employeeApi }) => {
    const employee = newEmployee({ firstName: 'Api', lastName: 'Before' });
    const created = await employeeApi.createEmployee(employee);
    const updated = updatedEmployee(employee);

    try {
      const response = await employeeApi.updatePersonalDetails(created.empNumber, updated);
      expect(response.firstName).toBe(updated.firstName);
      expect(response.lastName).toBe(updated.lastName);

      const fetched = await employeeApi.getEmployeeByNumber(created.empNumber);
      expect(fetched.firstName).toBe(updated.firstName);
      expect(fetched.lastName).toBe(updated.lastName);
    } finally {
      await employeeApi.deleteEmployee(created.empNumber);
    }
  });

  // Deletes an employee and verifies it is no longer available through search by employeeId.
  // This ensures delete requests remove the record rather than just returning a success status.
  test('API deletes an employee', { tag: '@api' }, async ({ employeeApi }) => {
    const employee = newEmployee({ firstName: 'Api', lastName: 'Delete' });
    const created = await employeeApi.createEmployee(employee);
    await employeeApi.deleteEmployee(created.empNumber);
    expect(await employeeApi.getEmployeeById(employee.employeeId)).toBeUndefined();
  });
});
