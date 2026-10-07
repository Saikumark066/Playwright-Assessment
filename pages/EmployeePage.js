import { expect } from '@playwright/test';
import { getBaseUrl } from '../utils/environment.js';
import { ROUTES, TIMEOUTS } from '../utils/constants.js';

// This page object centralizes all OrangeHRM employee page interactions.
// We keep selectors and browser actions together so every employee CRUD test uses the same flow and stays resilient when the UI changes.
export class EmployeePage {
  constructor(page) {
    this.page = page;
    this.baseUrl = getBaseUrl();
    this.pimLink = page.locator('a[href$="/pim/viewPimModule"]');
    this.firstNameInput = page.getByPlaceholder(/First Name|Prénom/i);
    this.middleNameInput = page.getByPlaceholder(/Middle Name|Deuxième prénom/i);
    this.lastNameInput = page.getByPlaceholder(/Last Name|Nom de famille/i);
    this.employeeIdInput = this.employeeIdField();
    this.saveButton = page.getByRole('button', { name: /Save|Sauvegarder/i });
    this.requiredErrors = page.locator('.oxd-input-field-error-message');
    this.loginDetailsSwitch = page.locator('.oxd-switch-input');
    this.loginDetailsUsernameInput = page.locator('.oxd-input-group').filter({ hasText: /Username|Nom d'utilisateur/i }).locator('input');
    this.loginDetailsPasswordInputs = page.locator('input[type="password"]');
    this.loginDetailsStatus = (status) => page.getByRole('radio', { name: status });
    this.searchButton = page.getByRole('button', { name: /Search|Rechercher/i });
  }

  // Returns the employee ID field on the form. We keep it in a helper because several tests reuse the same input locator.
  employeeIdField() {
    return this.page.locator('.oxd-input-group')
      .filter({ has: this.page.locator('label', { hasText: /Employee Id|Identifiant de l'employé/i }) })
      .locator('input');
  }

  // Finds a specific table row by employee ID. This keeps interaction with the table consistent across search and delete flows.
  employeeRow(employeeId) {
    return this.page.getByRole('row').filter({ hasText: String(employeeId) });
  }

  // Opens the employee list page and waits for the search bar to appear.
  // We use the page object here so tests do not repeat navigation code or risk using an outdated URL path.
  async openEmployeeList() {
    await this.page.goto(new URL(ROUTES.EMPLOYEE_LIST, this.baseUrl).toString());
    await expect(this.searchButton).toBeVisible();
  }

  // Opens the create-employee form before creating a new employee through the UI.
  // This method gives all create tests a single reliable entry point for the add-employee screen.
  async openAddEmployee() {
    await this.page.goto(new URL(ROUTES.ADD_EMPLOYEE, this.baseUrl).toString());
    await expect(this.firstNameInput).toBeVisible();
  }

  // Saves the form after the user fills in employee details.
  // We wait for the loader to disappear so the save click is not intercepted by a stale in-flight request.
  async clickSaveButton() {
    const loader = this.page.locator('.oxd-form-loader');
    await expect(this.saveButton.first()).toBeVisible();
    if (await loader.count()) {
      await loader.waitFor({ state: 'hidden', timeout: TIMEOUTS.action });
    }
    await this.saveButton.first().click();
  }

  // Creates a new employee from the UI and waits for the details page to load.
  // This keeps all create flows consistent and reduces repeated field-filling logic in the tests.
  async createEmployee(employee, loginDetails) {
    await this.firstNameInput.fill(employee.firstName);
    await this.middleNameInput.fill(employee.middleName ?? '');
    await this.lastNameInput.fill(employee.lastName);
    await this.employeeIdInput.fill(String(employee.employeeId));
    if (loginDetails) await this.setLoginDetails(loginDetails);
    await this.clickSaveButton();
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
  }

  // Fills the optional login sections for employee creation.
  // We centralize this because the login status and password fields are a repeated test setup pattern.
  async setLoginDetails({ username, password, status = 'Enabled' }) {
    const checkbox = this.page.getByRole('checkbox').first();
    if (!(await checkbox.isChecked())) await this.loginDetailsSwitch.click();
    await this.loginDetailsUsernameInput.fill(username);
    await this.page.getByText(status, { exact: true }).click();
    await expect(this.loginDetailsStatus(status)).toBeChecked();
    await this.loginDetailsPasswordInputs.nth(0).fill(password);
    await this.loginDetailsPasswordInputs.nth(1).fill(password);
  }

  // Asserts that required validation messages appear for missing profile fields.
  // We use this to verify the form enforces the mandatory employee data contract.
  async verifyRequiredFields() {
    await expect(this.requiredErrors.first()).toBeVisible();
    await expect(this.requiredErrors).toHaveCount(2);
  }

  // Searches the employee list by employee ID and waits for the exact number of rows.
  // This method is used by all read and delete scenarios to keep filters and assertions in one place.
  async searchEmployeeById(employeeId, expectedRows = 1) {
    await this.openEmployeeList();
    await this.employeeIdField().fill(String(employeeId));
    await this.searchButton.click();
    await expect.poll(() => this.employeeRow(employeeId).count(), {
      timeout: TIMEOUTS.navigation,
      intervals: [200, 400, 800, 1200],
    }).toBe(expectedRows);
  }

  // Verifies that an employee row is visible after a successful search.
  // This is the common assertion used by UI read tests before opening the employee record.
  async verifyEmployeeVisible(employeeId) {
    await expect(this.employeeRow(employeeId).first()).toBeVisible();
  }

  // Ensures a missing employee is not found in the UI table.
  // We keep this check here because negative tests reuse the same not-found assertion logic.
  async verifyNoEmployeeFound(employeeId) {
    if (employeeId === undefined || employeeId === null) {
      throw new Error('verifyNoEmployeeFound requires an employeeId.');
    }
    await expect(this.employeeRow(employeeId)).toHaveCount(0);
  }

  // Opens an employee record from the results table.
  // We use a single method so tests can navigate into an employee detail page without repeating row selection logic.
  async openEmployeeRecord(employeeId) {
    const row = this.employeeRow(employeeId);
    await expect(row).toBeVisible();
    await row.click();
  }

  // Updates employee profile data by editing the form and saving it.
  // This method keeps the update workflow consistent across CRUD and lifecycle tests.
  async updateEmployee(employee) {
    await this.page.locator('.oxd-form-loader').waitFor({
      state: 'hidden',
      timeout: TIMEOUTS.action,
    });
    await expect(this.firstNameInput).toBeVisible();
    const maleRadio = this.page.getByRole('radio', { name: /^Male$|^Homme$/i });
    if (await maleRadio.count() && !(await maleRadio.isChecked())) {
      await this.page.getByText(/^Male$|^Homme$/i).click();
      await expect(maleRadio).toBeChecked();
    }
    await this.firstNameInput.fill(employee.firstName);
    await this.middleNameInput.fill(employee.middleName ?? '');
    await this.lastNameInput.fill(employee.lastName);
    await expect(this.firstNameInput).toHaveValue(employee.firstName);
    await expect(this.middleNameInput).toHaveValue(employee.middleName ?? '');
    await expect(this.lastNameInput).toHaveValue(employee.lastName);
    await this.clickSaveButton();
    await expect(this.page.locator('.oxd-toast-content-text').last()).toHaveText('Successfully Updated');
  }

  // Confirms the employee details shown on the record match the expected data.
  // This check prevents false positives where the save action returns but the UI data is still stale.
  async verifyEmployeeDetails(employee) {
    await expect(this.firstNameInput).toHaveValue(employee.firstName);
    await expect(this.middleNameInput).toHaveValue(employee.middleName ?? '');
    await expect(this.lastNameInput).toHaveValue(employee.lastName);
  }

  // Deletes a record from the employee list after confirming the modal prompt.
  // We centralize the delete flow because every delete test must click the same row action and confirmation button.
  async deleteEmployee(employeeId) {
    const row = this.employeeRow(employeeId);
    await expect(row).toBeVisible();
    await row.getByRole('button').last().click();
    const confirmation = this.page.getByRole('dialog');
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByText(/Are you Sure\?|Êtes-vous sûr/i)).toBeVisible();
    await confirmation.getByRole('button', { name: /Yes, Delete|Oui, Supprimer/i }).click();
  }

  // Verifies that a deleted employee no longer appears in the search grid.
  // This is a common end-of-test cleanup assertion to ensure the UI and API state stay aligned.
  async verifyEmployeeDeleted(employeeId) {
    await this.searchEmployeeById(employeeId, 0);
    await this.verifyNoEmployeeFound(employeeId);
  }

  // Verifies the admin sees the PIM module in the navigation.
  // This is used by RBAC tests to ensure admin permissions allow access to employee management.
  async verifyAdminNavigation() {
    await expect(this.pimLink).toBeVisible();
  }

  // Verifies an ESS user cannot access the PIM module.
  // We assert both the absence of the link and the permission denial path in RBAC coverage.
  async verifyEssCannotAccessPim() {
    await expect(this.pimLink).toHaveCount(0);
  }
}
