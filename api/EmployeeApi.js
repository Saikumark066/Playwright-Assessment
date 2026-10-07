import { BaseApi } from './BaseApi.js';

// This client wraps the OrangeHRM employee REST API to support UI-backed CRUD tests.
// We keep the HTTP calls in one place so the tests can verify UI state against the same employee records created via API.
export class EmployeeApi extends BaseApi {
  constructor(request) {
    super(request);
    this.endpoint = 'api/v2/pim/employees';
  }

  // Creates an employee using the public employee API.
  // We use this in fixtures and API tests to create deterministic seed data before verifying UI behavior.
  async createEmployee(employee) {
    const response = await this.request.post(this.endpoint, { data: {
      firstName: employee.firstName,
      middleName: employee.middleName ?? '',
      lastName: employee.lastName,
      employeeId: String(employee.employeeId),
    }});
    return this.parseData(response);
  }

  // Fetches a single employee by internal empNumber.
  // This is the stable API lookup used to verify the record after UI updates and deletions.
  async getEmployeeByNumber(empNumber) {
    const response = await this.request.get(`${this.endpoint}/${empNumber}`, { params: { model: 'detailed' } });
    return this.parseData(response);
  }

  // Searches employees by external employeeId and returns the first matching result.
  // We use this for assertions that compare the UI-created employee to the API record from the same ID.
  async getEmployeeById(employeeId) {
    const response = await this.request.get(this.endpoint, {
      params: { employeeId: String(employeeId), limit: 1, offset: 0, model: 'detailed' },
    });
    const employees = await this.parseData(response);
    if (!Array.isArray(employees)) {
      throw new Error('Employee search response data must be an array.');
    }
    return employees[0];
  }

  // Updates personal details for a given employee number.
  // This is used in API tests and UI verification to confirm the update payload is persisted correctly.
  async updatePersonalDetails(empNumber, employee) {
    const response = await this.request.put(`${this.endpoint}/${empNumber}/personal-details`, { data: {
      firstName: employee.firstName,
      middleName: employee.middleName ?? '',
      lastName: employee.lastName,
      employeeId: String(employee.employeeId),
      otherId: employee.otherId ?? '',
      drivingLicenseNo: employee.drivingLicenseNo ?? '',
      drivingLicenseExpiredDate: employee.drivingLicenseExpiredDate ?? null,
      gender: employee.gender ?? null,
      maritalStatus: employee.maritalStatus ?? '',
      birthday: employee.birthday ?? null,
      nationalityId: employee.nationalityId ?? null,
    }});
    return this.parseData(response);
  }

  // Deletes one or many employees via the bulk delete endpoint.
  // We allow either a single value or an array so tests can clean up one record or a batch consistently.
  async deleteEmployees(empNumbers) {
    const ids = Array.isArray(empNumbers) ? empNumbers : [empNumbers];
    const response = await this.request.delete(this.endpoint, { data: { ids } });
    return this.parse(response);
  }

  // Deletes a single employee using the bulk delete helper.
  // This keeps test cleanup concise while still using the shared delete implementation.
  async deleteEmployee(empNumber) {
    return this.deleteEmployees(empNumber);
  }
}
