
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EmployeePage } from '../pages/EmployeePage';

let employeePage;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  employeePage = new EmployeePage(page);

  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await loginPage.verifyLoginSuccess();
});

test.afterEach(async ({ page }) => {
  await page.close();
});

test('OrangeHRM Admin should not create an employee with empty required fields', async () => {
  // Open Add Employee form
  await employeePage.openAddEmployee();
  await employeePage.saveButton.first().click();
  await employeePage.verifyRequiredFields();
});

test('OrangeHRM Admin should create, search, update and delete an employee', async ({ page }) => {
  const uniqueEmployeeId = Number(Date.now().toString().slice(-6));

  const employee = {
    firstName: 'Test',
    middleName: 's',
    lastName: 'User',
    employeeId: uniqueEmployeeId,
    nationality: 'Indian',
    dateOfBirth: '1990-01-01',
    bloodType: 'A+',
    driverLicenseNumber: 'DL-123456789',
    licenseExpiryDate: '2035-01-01',
  };

  // Open Add Employee form
  await employeePage.openAddEmployee();

  // Create employee
  await employeePage.createEmployee(employee);

  await employeePage.verifyEmployeeDetails(employee);

  // Search employee
  await employeePage.searchEmployeeById(employee.employeeId);

  // Verify employee is visible
  await employeePage.verifyEmployeeVisible(employee.employeeId);

  // Open employee record
  await employeePage.openEmployeeRecord(employee.employeeId);
  await employeePage.clickEditEmployee(employee.employeeId);

  // Update employee details
  await employeePage.updateEmployee(employee);

  // Verify updated employee details
  await employeePage.verifyEmployeeDetails(employee);

  // Navigate back to Employee List and search employee
  await employeePage.openEmployeeRecord(employee.employeeId);

  // Verify updated employee is visible
  await employeePage.verifyEmployeeVisible(employee.employeeId);

  await expect(
    page.getByRole('row').filter({ hasText: employee.employeeId })
  ).toContainText('sd');

  // Delete employee
  await employeePage.deleteEmployee(employee.employeeId);

  // Verify employee is deleted
  await employeePage.verifyEmployeeDeleted(employee.employeeId);
});

test('OrangeHRM Admin should see no records for a non-existing employee', async () => {
  // Search for a non-existing employee
  await employeePage.searchEmployeeById('99999999');
  // Verify no employee is found
  await employeePage.verifyNoEmployeeFound();
});
