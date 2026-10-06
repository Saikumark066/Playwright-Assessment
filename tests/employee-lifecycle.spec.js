import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { EmployeePage } from "../pages/EmployeePage";
import { createUniqueEmployeeId } from "../utils/testData";

let employeePage;

async function createEmployeeRecord(employee) {
  await employeePage.openAddEmployee();
  await employeePage.createEmployee(employee);
  await employeePage.verifyEmployeeDetails(employee);
}

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  employeePage = new EmployeePage(page);

  await loginPage.goto();
  await loginPage.login();
  await loginPage.verifyLoginSuccess();
});

test("OrangeHRM Admin should not create an employee with empty required fields @employee @negative", async () => {
  await employeePage.openAddEmployee();
  await employeePage.clickSaveButton();
  await employeePage.verifyRequiredFields();
});

test("OrangeHRM Admin should create an employee @employee @crud", async () => {
  const uniqueEmployeeId = createUniqueEmployeeId();
  const employee = {
    firstName: "Create",
    middleName: "User",
    lastName: "One",
    employeeId: uniqueEmployeeId,
  };

  await createEmployeeRecord(employee);
  await employeePage.searchEmployeeById(employee.employeeId);
  await employeePage.verifyEmployeeVisible(employee.employeeId);
});

test("OrangeHRM Admin should read an employee @employee @crud", async () => {
  const uniqueEmployeeId = createUniqueEmployeeId();
  const employee = {
    firstName: "Read",
    middleName: "Employee",
    lastName: "Record",
    employeeId: uniqueEmployeeId,
  };

  await createEmployeeRecord(employee);
  await employeePage.searchEmployeeById(employee.employeeId);
  await employeePage.verifyEmployeeVisible(employee.employeeId);
  await employeePage.openEmployeeRecord(employee.employeeId);
  await employeePage.verifyEmployeeDetails(employee);
});

test("OrangeHRM Admin should update an employee @employee @crud", async ({ page }) => {
  const uniqueEmployeeId = createUniqueEmployeeId();
  const employee = {
    firstName: "Update",
    middleName: "User",
    lastName: "Before",
    employeeId: uniqueEmployeeId,
  };

  await createEmployeeRecord(employee);
  await employeePage.searchEmployeeById(employee.employeeId);
  await employeePage.verifyEmployeeVisible(employee.employeeId);
  await employeePage.openEmployeeRecord(employee.employeeId);
  await expect(employeePage.firstNameInput).toHaveValue(employee.firstName);
  await expect(employeePage.middleNameInput).toHaveValue(employee.middleName);
  await expect(employeePage.lastNameInput).toHaveValue(employee.lastName);

  const updatedEmployee = {
    ...employee,
    firstName: "Updated",
    middleName: "Edited",
    lastName: "After",
  };

  await employeePage.firstNameInput.fill(updatedEmployee.firstName);
  await employeePage.middleNameInput.fill(updatedEmployee.middleName);
  await employeePage.lastNameInput.fill(updatedEmployee.lastName);

  await expect.soft(employeePage.firstNameInput).toHaveValue(updatedEmployee.firstName);
  await expect.soft(employeePage.middleNameInput).toHaveValue(updatedEmployee.middleName);
  await expect.soft(employeePage.lastNameInput).toHaveValue(updatedEmployee.lastName);
  await employeePage.clickSaveButton();
  await expect(page.getByText("Successfully Updated")).toBeVisible();
  await page.reload();
  await employeePage.verifyEmployeeDetails(updatedEmployee);
});

test("OrangeHRM Admin should delete an employee @employee @crud", async () => {
  const uniqueEmployeeId = createUniqueEmployeeId();
  const employee = {
    firstName: "Delete",
    middleName: "User",
    lastName: "Record",
    employeeId: uniqueEmployeeId,
  };

  await createEmployeeRecord(employee);
  await employeePage.searchEmployeeById(employee.employeeId);
  await employeePage.verifyEmployeeVisible(employee.employeeId);
  await employeePage.deleteEmployee(employee.employeeId);
  await employeePage.verifyEmployeeDeleted(employee.employeeId);
});

test("OrangeHRM Admin should see no records for a non-existing employee @employee @smoke", async () => {
  await employeePage.searchEmployeeById("99999999", { expectRows: 0 });
  await employeePage.verifyNoEmployeeFound();
});
