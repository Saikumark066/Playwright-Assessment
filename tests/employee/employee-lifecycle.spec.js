import { test, expect } from '../../fixtures/test.js';
import { newEmployee, updatedEmployee } from '../../data/employeeData.js';

// This suite validates the full employee lifecycle through the application UI and the API.
// We keep these scenarios together so create, read, update, and delete behavior is tested as one business flow instead of isolated fragments.

test.describe('Employee lifecycle', () => {
  // Creates an employee in the UI and verifies that the same employee is visible through the API.
  // This catches mismatches between form submission and persisted backend data before later lifecycle tests rely on the record.
  test('Admin can create an employee through UI and verify it through API', { tag: ['@crud', '@e2e'] }, async ({ employeePage, employeeApi }) => {
    const employee = newEmployee({ firstName: 'Create', lastName: 'Employee' });
    try {
      await employeePage.openAddEmployee();
      await employeePage.createEmployee(employee);
      await employeePage.verifyEmployeeDetails(employee);

      const apiEmployee = await employeeApi.getEmployeeById(employee.employeeId);
      expect(apiEmployee).toBeDefined();
      expect(apiEmployee.firstName).toBe(employee.firstName);
      expect(apiEmployee.lastName).toBe(employee.lastName);
    } finally {
      const apiEmployee = await employeeApi.getEmployeeById(employee.employeeId);
      if (apiEmployee?.empNumber) await employeeApi.deleteEmployee(apiEmployee.empNumber);
    }
  });

  // Runs the complete lifecycle path: read in the UI, update, then delete and confirm the record is gone.
  // We split this into steps so failures identify exactly which stage in the business flow regressed.
  test('Admin can complete the employee lifecycle through UI and verify each stage through API', { tag: ['@crud', '@e2e', '@parallel-safe'] }, async ({ employeePage, employeeApi, employee }) => {
    const updated = updatedEmployee(employee);
    await test.step('Read the API-created employee in the UI', async () => {
      await employeePage.searchEmployeeById(employee.employeeId);
      await employeePage.verifyEmployeeVisible(employee.employeeId);
      await employeePage.openEmployeeRecord(employee.employeeId);
      await employeePage.verifyEmployeeDetails(employee);
    });

    await test.step('Update the employee and verify the API state', async () => {
      await employeePage.updateEmployee(updated);
      await employeePage.verifyEmployeeDetails(updated);

      const updatedApiEmployee = await employeeApi.getEmployeeById(employee.employeeId);
      expect(updatedApiEmployee).toBeDefined();
      expect(updatedApiEmployee.firstName).toBe(updated.firstName);
      expect(updatedApiEmployee.middleName).toBe(updated.middleName);
      expect(updatedApiEmployee.lastName).toBe(updated.lastName);
    });

    await test.step('Delete the employee and verify it is absent from the API', async () => {
      await employeePage.searchEmployeeById(employee.employeeId);
      await employeePage.deleteEmployee(employee.employeeId);
      await employeePage.verifyEmployeeDeleted(employee.employeeId);
      expect(await employeeApi.getEmployeeById(employee.employeeId)).toBeUndefined();
    });
  });

  // Validates that a record created by the API can be discovered and opened from the UI list.
  // This ensures the employee list search filters work even when the record was not created directly through the browser.
  test('Admin can read an employee created by the API', { tag: '@crud' }, async ({ employeePage, employee }) => {
    await employeePage.searchEmployeeById(employee.employeeId);
    await employeePage.verifyEmployeeVisible(employee.employeeId);
    await employeePage.openEmployeeRecord(employee.employeeId);
    await employeePage.verifyEmployeeDetails(employee);
  });

  // Updates a record created via API and confirms the backend reflects the edited values.
  // We separate this scenario so update logic is validated independent of create-specific flows.
  test('Admin can update an employee and verify the update through API', { tag: '@crud' }, async ({ employeePage, employeeApi, employee }) => {
    const updated = updatedEmployee(employee);
    await employeePage.searchEmployeeById(employee.employeeId);
    await employeePage.openEmployeeRecord(employee.employeeId);
    await employeePage.updateEmployee(updated);

    const apiEmployee = await employeeApi.getEmployeeById(employee.employeeId);
    expect(apiEmployee).toBeDefined();
    expect(apiEmployee.firstName).toBe(updated.firstName);
    expect(apiEmployee.middleName).toBe(updated.middleName);
    expect(apiEmployee.lastName).toBe(updated.lastName);
  });

  // Deletes a record from the UI and verifies the API also no longer finds it.
  // This test guards against a UI-only deletion that does not actually persist in the backend.
  test('Admin can delete an employee and verify deletion through API', { tag: '@crud' }, async ({ employeePage, employeeApi, employee }) => {
    await employeePage.searchEmployeeById(employee.employeeId);
    await employeePage.deleteEmployee(employee.employeeId);
    await employeePage.verifyEmployeeDeleted(employee.employeeId);
    expect(await employeeApi.getEmployeeById(employee.employeeId)).toBeUndefined();
  });

  // Ensures the employee search correctly shows zero records for an ID that does not exist.
  // This negative check confirms the search filter does not return stale or unrelated employees.
  test('Admin sees no records for a non-existing employee', { tag: ['@smoke', '@negative'] }, async ({ employeePage }) => {
    const nonExistingId = `9${Date.now().toString().slice(-7)}`;
    await employeePage.searchEmployeeById(nonExistingId, 0);
    await employeePage.verifyNoEmployeeFound(nonExistingId);
  });

  // Validates required employee fields when creating a new record without mandatory values.
  // We assert the frontend validation contract here so incomplete employee submissions are rejected consistently.
  test('Required employee fields are validated', { tag: '@negative' }, async ({ employeePage }) => {
    await employeePage.openAddEmployee();
    await employeePage.employeeIdInput.fill(newEmployee().employeeId);
    await employeePage.clickSaveButton();
    await employeePage.verifyRequiredFields();
  });
});
