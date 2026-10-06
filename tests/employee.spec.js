import { expect, test } from "@playwright/test";
import { EmployeePage } from "../pages/EmployeePage";
import { LoginPage } from "../pages/LoginPage";
import { createUniqueEmployeeId } from "../utils/testData";
import { getBaseUrl } from "../utils/environment";

test("Admin can create an employee with a disabled login account @employee @auth @negative", async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const employeePage = new EmployeePage(page);
  const employeeId = createUniqueEmployeeId();
  const username = `disabled${employeeId}`;
  const password = "DisabledUser!2026";
  const employee = {
    firstName: "Disabled",
    middleName: "",
    lastName: "Test",
    employeeId,
  };

  await loginPage.goto();
  await loginPage.login();
  await loginPage.verifyLoginSuccess();

  await employeePage.openAddEmployee();
  await employeePage.createEmployee(employee, {
    username,
    password,
    status: "Disabled",
  });

  await page.goto(new URL("auth/logout", getBaseUrl()).toString());
  await loginPage.login(username, password);

  await expect.soft(page.getByRole("alert")).toContainText("Account disabled");
});
