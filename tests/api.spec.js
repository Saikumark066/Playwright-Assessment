import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { EmployeePage } from "../pages/EmployeePage";
import { EmployeeApi } from "../pages/EmployeeApi";
import { getBaseUrl } from "../utils/environment";
import { createUniqueEmployeeId } from "../utils/testData";

test.describe("Employee API Tests @api", () => {
  let employeeApi;
  let employeePage;

  test.beforeEach(async ({ page }) => {
    // UI Page Object
    employeePage = new EmployeePage(page);

    // API Page Object
    employeeApi = new EmployeeApi(page.context().request, getBaseUrl());

    // Login through UI
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();

    await loginPage.verifyLoginSuccess();
  });

  test("Verify Employee API returns employee data @smoke", async () => {
    const { response, body } = await employeeApi.getEmployees();

    // Status code
    expect.soft(response.status()).toBe(200);

    // Response structure
    expect.soft(body).toHaveProperty("data");
    expect.soft(body).toHaveProperty("meta");

    // Data should be an array
    expect.soft(Array.isArray(body.data)).toBeTruthy();

    // At least one employee
    expect.soft(body.data.length).toBeGreaterThan(0);

    // Validate first employee structure
    const employee = body.data[0];
    expect.soft(employee).toHaveProperty("empNumber");
    expect.soft(employee).toHaveProperty("firstName");
    expect.soft(employee).toHaveProperty("lastName");
    expect.soft(employee).toHaveProperty("employeeId");

  });

  test("Verify employee created through UI exists in API", async ({ page }) => {
    const uniqueEmployeeId = createUniqueEmployeeId();

    const employee = {
      firstName: "APITest",
      middleName: "M",
      lastName: "User",
      employeeId: uniqueEmployeeId,
    };

    // CREATE EMPLOYEE THROUGH UI

    await employeePage.openAddEmployee();
    await employeePage.createEmployee(employee);
    // Verify UI
    await employeePage.verifyEmployeeDetails(employee);

    // VERIFY THROUGH API

    const apiEmployee = await employeeApi.verifyEmployeeExists(
      employee.employeeId,
    );

    expect.soft(apiEmployee.firstName).toBe(employee.firstName);
    expect.soft(apiEmployee.middleName).toBe(employee.middleName);
    expect.soft(apiEmployee.lastName).toBe(employee.lastName);
    expect.soft(String(apiEmployee.employeeId)).toBe(String(employee.employeeId));
    //console.log("Employee verified through API:", apiEmployee);
  });

  test("Verify UI employee details match API response", async () => {
    const { body } = await employeeApi.getEmployees();
    const employee = body.data[0];
    //console.log("Employee selected from API:", employee);

    // Search employee through UI
    await employeePage.searchEmployeeById(employee.employeeId);

    // Verify employee appears in UI
    await employeePage.verifyEmployeeVisible(employee.employeeId);

    // Open employee
    await employeePage.openEmployeeRecord(employee.employeeId);

    // Verify UI fields against API data
    await expect.soft(employeePage.firstNameInput).toHaveValue(employee.firstName);
    await expect.soft(employeePage.middleNameInput).toHaveValue(
      employee.middleName || "",
    );
    await expect.soft(employeePage.lastNameInput).toHaveValue(employee.lastName);
  });

  test("Verify non-existing employee is not returned by API", async () => {
    const nonExistingEmployeeId = "99999999";
    await employeeApi.verifyEmployeeDoesNotExist(nonExistingEmployeeId);
  });
});
