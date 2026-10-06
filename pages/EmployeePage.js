import { expect } from '@playwright/test';

export class EmployeePage {
  constructor(page) {
    this.page = page;

    // Navigation
    this.pimLink = page.getByRole('link', { name: 'PIM' });
    this.employeeListLink = page.getByRole('link', {
      name: 'Employee List',
    });

    // Employee form
    this.addEmployeeButton = page.getByRole('button', { name: /Add/ });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.middleNameInput = page.getByPlaceholder('Middle Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: 'Employee Id' }) })
      .locator('input');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.requiredErrors = page.locator('.oxd-input-field-error-message');
    //Employee update form
    this.maritalStatusDropdown = page.getByText('Marital Status-- Select --');
    this.maleRadioButton = page.locator('input[type="radio"][value="1"]');
    this.femaleRadioButton = page.locator('input[type="radio"][value="2"]');
    this.nationalityDropdown = page.getByText('Nationality').locator('..').locator('input');
    this.dateOfBirthInput = page.getByText('Date of Birth').locator('..').locator('input');
    this.bloodTypeDropdown = page.getByText(/Blood Type/i);
    this.driverLicenseNumberInput = page.getByText(/Driver's License Number/i).locator('..').locator('input');
    this.licenseExpiryDateInput = page.getByText(/License Expiry Date/i).locator('..').locator('input');


    this.getEmployeeRow = (employeeId) =>
    this.page.getByRole('row').filter({ hasText: employeeId });

    this.editButton = (employeeId) =>
    this.getEmployeeRow(employeeId).locator('button').first();

    // Employee list search
    this.employeeNameInput = page.getByRole('textbox', {
      name: 'Type for hints...',
    }).first();
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
  }

  async openEmployeeList() {
    await this.pimLink.click();
    await expect.soft(this.employeeListLink).toBeEnabled(); 
    await this.employeeListLink.click();
  }

  async openAddEmployee() {
    await this.pimLink.click();
    await this.addEmployeeButton.click();
    await expect(this.firstNameInput).toBeVisible();
  }

  async createEmployee(employee) {
    await this.firstNameInput.fill(employee.firstName);
    await this.middleNameInput.fill(employee.middleName || '');
    await this.lastNameInput.fill(employee.lastName);
    await this.employeeIdInput.fill(String(employee.employeeId));
    await this.saveButton.first().click();
  }

  async verifyRequiredFields() {
    await expect(this.requiredErrors.first()).toBeVisible();
    await expect(this.requiredErrors).toHaveCount(2);
  }

  async searchEmployeeById(employeeId) {
    await this.openEmployeeList();

    const employeeIdInput = this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label', { hasText: 'Employee Id' }) })
      .locator('input');
    await employeeIdInput.fill(String(employeeId));
    await this.searchButton.click();
  }

  async searchEmployeeByName(employeeName) {
    await this.openEmployeeList();
    await this.employeeNameInput.fill(employeeName);

    const suggestion = this.page.getByRole('option', {
      name: new RegExp(employeeName, 'i'),
    });

    if (await suggestion.count()) {
      await suggestion.first().click();
    }

    await this.searchButton.click();
  }

  async verifyEmployeeVisible(employeeId) {
    await expect(
      this.page.getByRole('row').filter({ hasText: employeeId }).first()
    ).toBeVisible();
  }

  async verifyNoEmployeeFound(employeeId) {
    await expect(
      this.page.getByRole('row').filter({ hasText: String(employeeId) })
    ).toHaveCount(0);
  }

  async openEmployeeRecord(employeeId) {
    const employeeRow = this.page.getByRole('row').filter({
      hasText: employeeId,
    });

    await expect(employeeRow).toBeVisible();
    await employeeRow.click();
  }

  async updateEmployee(employee) {
    await this.maleRadioButton.click();

    if (employee.nationality) {
      await this.nationalityDropdown.click();
      await this.page.getByRole('option', { name: employee.nationality }).click();
    }

    if (employee.dateOfBirth) {
      await this.dateOfBirthInput.fill(employee.dateOfBirth);
    }

    if (employee.bloodType) {
      await this.bloodTypeDropdown.click();
      await this.page.getByRole('option', { name: employee.bloodType }).click();
    }

    if (employee.driverLicenseNumber) {
      await this.driverLicenseNumberInput.fill(employee.driverLicenseNumber);
    }

    if (employee.licenseExpiryDate) {
      await this.licenseExpiryDateInput.fill(employee.licenseExpiryDate);
    }

    // Save updated personal details
    await this.saveButton.first().click();
  }

  async verifyEmployeeDetails(employee) {
    await expect(this.firstNameInput).toHaveValue(employee.firstName);
    await expect(this.middleNameInput).toHaveValue(employee.middleName);
    await expect(this.lastNameInput).toHaveValue(employee.lastName);
  }

  async deleteEmployee(employeeId) {
    const employeeRow = this.page.getByRole('row').filter({
      hasText: employeeId,
    });

    await expect(employeeRow).toBeVisible();
    await employeeRow.getByRole('button').last().click();
    await expect(this.page.getByText('Are you Sure?')).toBeVisible();
    await this.page.getByRole('button', { name: /Yes, Delete/ }).click();
  }

  async verifyEmployeeDeleted(employeeId) {
    await this.searchEmployeeById(employeeId);
    await this.verifyNoEmployeeFound(employeeId);
  }

  async clickEditEmployee(employeeId) {
  const employeeRow = this.getEmployeeRow(employeeId);
}

}
