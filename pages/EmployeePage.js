import { expect } from "@playwright/test";
import { getBaseUrl } from "../utils/environment";

export class EmployeePage {
  constructor(page) {
    this.page = page;
    this.baseUrl = getBaseUrl();

    this.pimLink = page.getByRole("link", { name: "PIM" });
    this.employeeListLink = page.getByRole("link", { name: "Employee List" });

    this.addEmployeeButton = page.getByRole("button", { name: /Add/ });
    this.firstNameInput = page.getByPlaceholder("First Name");
    this.middleNameInput = page.getByPlaceholder("Middle Name");
    this.lastNameInput = page.getByPlaceholder("Last Name");
    this.employeeIdInput = page
      .locator(".oxd-input-group")
      .filter({ has: page.locator("label", { hasText: "Employee Id" }) })
      .locator("input");
    this.saveButton = page.getByRole("button", { name: "Save" });
    this.requiredErrors = page.locator(".oxd-input-field-error-message");
    this.loginDetailsSwitch = page.locator(".oxd-switch-input");
    this.loginDetailsUsernameInput = page
      .locator(".oxd-input-group")
      .filter({ hasText: "Username" })
      .locator("input");
    this.loginDetailsStatus = (status) =>
      page.getByRole("radio", { name: status });
    this.loginDetailsPasswordInputs = page.locator('input[type="password"]');

    this.maritalStatusDropdown = page.getByText("Marital Status-- Select --");
    this.maleRadioButton = page.locator('input[type="radio"][value="1"]');
    this.femaleRadioButton = page.locator('input[type="radio"][value="2"]');
    this.nationalityDropdown = page.getByText("Nationality").locator("..").locator("input");
    this.dateOfBirthInput = page.getByText("Date of Birth").locator("..").locator("input");
    this.bloodTypeDropdown = page.getByText(/Blood Type/i);
    this.driverLicenseNumberInput = page
      .getByText(/Driver's License Number/i)
      .locator("..")
      .locator("input");
    this.licenseExpiryDateInput = page
      .getByText(/License Expiry Date/i)
      .locator("..")
      .locator("input");

    this.getEmployeeRow = (employeeId) =>
      this.page.getByRole("row").filter({ hasText: employeeId });

    this.editButton = (employeeId) =>
      this.getEmployeeRow(employeeId).locator("button").first();

    this.employeeNameInput = page
      .getByRole("textbox", { name: "Type for hints..." })
      .first();
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.resetButton = page.getByRole("button", { name: "Reset" });
  }

  async openEmployeeList() {
    await this.pimLink.click();
    await expect(this.employeeListLink).toBeVisible();
    await this.employeeListLink.click();
    await expect(this.searchButton).toBeVisible();
  }

  async openAddEmployee() {
    await this.page.goto(new URL("pim/addEmployee", this.baseUrl).toString());
    await expect.soft(this.firstNameInput).toBeVisible();
  }

  async clickSaveButton() {
    const saveButton = this.saveButton.first();

    await saveButton.waitFor({ state: "visible" });
    await this.page.locator(".oxd-form-loader").waitFor({
      state: "hidden",
      timeout: 15000,
    });
    await saveButton.click();
  }

  async createEmployee(employee, loginDetails) {
    await this.firstNameInput.waitFor({ state: "visible" });
    await this.firstNameInput.fill(employee.firstName);
    await this.middleNameInput.fill(employee.middleName || "");
    await this.lastNameInput.fill(employee.lastName);
    await this.employeeIdInput.fill(String(employee.employeeId));

    if (loginDetails) {
      await this.setLoginDetails(loginDetails);
    }

    await this.clickSaveButton();
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/, {
      timeout: 20000,
    });
  }

  async setLoginDetails({ username, password, status = "Enabled" }) {
    const loginDetailsCheckbox = this.page.getByRole("checkbox");

    if (!(await loginDetailsCheckbox.isChecked())) {
      await this.loginDetailsSwitch.click();
    }

    await this.loginDetailsUsernameInput.fill(username);
    await this.page.getByText(status, { exact: true }).click();
    await expect(this.loginDetailsStatus(status)).toBeChecked();
    await this.loginDetailsPasswordInputs.nth(0).fill(password);
    await this.loginDetailsPasswordInputs.nth(1).fill(password);
  }

  async verifyRequiredFields() {
    await expect.soft(this.requiredErrors.first()).toBeVisible();
    await expect.soft(this.requiredErrors).toHaveCount(2);
  }

  async searchEmployeeById(employeeId, options = { expectRows: 1 }) {
    await this.openEmployeeList();
    await expect.soft(this.searchButton).toBeVisible();

    const employeeIdInput = this.page
      .locator(".oxd-input-group")
      .filter({ has: this.page.locator("label", { hasText: "Employee Id" }) })
      .locator("input");

    await employeeIdInput.fill(String(employeeId));
    await this.searchButton.click();

    await expect
      .poll(async () => {
        const rows = this.page.getByRole("row").filter({
          hasText: String(employeeId),
        });
        return await rows.count();
      }, {
        timeout: 15000,
        intervals: [200, 400, 800, 1200],
      })
      .toBe(options.expectRows);
  }

  async searchEmployeeByName(employeeName) {
    await this.openEmployeeList();
    await this.employeeNameInput.fill(employeeName);

    const suggestion = this.page.getByRole("option", {
      name: new RegExp(employeeName, "i"),
    });

    if (await suggestion.count()) {
      await suggestion.first().click();
    }

    await this.searchButton.click();
  }

  async verifyEmployeeVisible(employeeId) {
    await expect.soft(
      this.page.getByRole("row").filter({ hasText: employeeId }).first(),
    ).toBeVisible();
  }

  async verifyNoEmployeeFound(employeeId) {
    await expect.soft(
      this.page.getByRole("row").filter({ hasText: String(employeeId) }),
    ).toHaveCount(0);
  }

  async openEmployeeRecord(employeeId) {
    const employeeRow = this.page.getByRole("row").filter({
      hasText: employeeId,
    });

    await expect(employeeRow).toBeVisible();
    await employeeRow.click();
  }

  async updateEmployee(employee) {
    await this.page
      .locator(".oxd-form-loader")
      .waitFor({ state: "hidden", timeout: 15000 })
      .catch(() => {});
    await this.maleRadioButton.waitFor({ state: "visible", timeout: 15000 });
    await this.maleRadioButton.click({ force: true });

    if (employee.nationality) {
      await this.nationalityDropdown.click();
      await this.page.getByRole("option", { name: employee.nationality }).click();
    }

    if (employee.dateOfBirth) {
      await this.dateOfBirthInput.fill(employee.dateOfBirth);
    }

    if (employee.bloodType) {
      await this.bloodTypeDropdown.click();
      await this.page.getByRole("option", { name: employee.bloodType }).click();
    }

    if (employee.driverLicenseNumber) {
      await this.driverLicenseNumberInput.fill(employee.driverLicenseNumber);
    }

    if (employee.licenseExpiryDate) {
      await this.licenseExpiryDateInput.fill(employee.licenseExpiryDate);
    }

    await this.clickSaveButton();
  }

  async verifyEmployeeDetails(employee) {
    await expect.soft(this.firstNameInput).toHaveValue(employee.firstName);
    await expect.soft(this.middleNameInput).toHaveValue(employee.middleName);
    await expect.soft(this.lastNameInput).toHaveValue(employee.lastName);
  }

  async deleteEmployee(employeeId) {
    const employeeRow = this.page.getByRole("row").filter({
      hasText: employeeId,
    });

    await expect.soft(employeeRow).toBeVisible();
    await employeeRow.getByRole("button").last().click();
    await expect.soft(this.page.getByText("Are you Sure?")).toBeVisible();
    await this.page.getByRole("button", { name: /Yes, Delete/ }).click();
  }

  async verifyEmployeeDeleted(employeeId) {
    await this.searchEmployeeById(employeeId, { expectRows: 0 });
    await this.verifyNoEmployeeFound(employeeId);
  }

}
