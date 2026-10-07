import { test, expect } from '../../fixtures/test.js';
import { newEmployee } from '../../data/employeeData.js';

// This contract test verifies the API can fetch an employee by empNumber directly.
// We use it to protect the direct lookup contract that other API and UI flows depend on for stable record retrieval.

test('Employee API supports direct employee-number lookup', { tag: ['@api', '@smoke'] }, async ({ employeeApi }) => {
  const employee = newEmployee({ firstName: 'Contract', lastName: 'Check' });
  const created = await employeeApi.createEmployee(employee);

  try {
    const fetched = await employeeApi.getEmployeeByNumber(created.empNumber);
    expect(fetched.empNumber).toBe(created.empNumber);
    expect(fetched.employeeId).toBe(employee.employeeId);
  } finally {
    await employeeApi.deleteEmployee(created.empNumber);
  }
});
