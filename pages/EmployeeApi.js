import { expect } from "@playwright/test";

export class EmployeeApi {
  constructor(request, baseURL) {
    this.request = request;
    this.baseURL = baseURL;
    this.employeeEndpoint = "api/v2/pim/employees";
  }

  // GET all current employees
  async getEmployees() {
    const response = await this.request.get(
      `${this.baseURL}${this.employeeEndpoint}`,
      {
        params: {
          limit: 200,
          offset: 0,
          model: "detailed",
          includeEmployees: "onlyCurrent",
          sortField: "employee.firstName",
          sortOrder: "ASC",
        },
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(Array.isArray(body.data)).toBeTruthy();
    return {
      response,
      body,
    };
  }

  // Find employee using Employee ID
  async getEmployeeById(employeeId) {
    const { body } = await this.getEmployees();

    const employee = body.data.find(
      (item) => String(item.employeeId) === String(employeeId),
    );
    return employee;
  }

  // Verify employee exists
  async verifyEmployeeExists(employeeId) {
    let employee;

    await expect
      .poll(async () => {
        employee = await this.getEmployeeById(employeeId);
        return employee;
      })
      .toBeDefined();
    return employee;
  }

  // Verify employee does not exist
  async verifyEmployeeDoesNotExist(employeeId) {
    const employee = await this.getEmployeeById(employeeId);
    expect(employee).toBeUndefined();
  }

  // Verify employee fields
  async verifyEmployeeDetails(employee) {
    const apiEmployee = await this.getEmployeeById(employee.employeeId);
    expect(apiEmployee).toBeDefined();
    expect(apiEmployee.firstName).toBe(employee.firstName);
    expect(apiEmployee.middleName).toBe(employee.middleName);
    expect(apiEmployee.lastName).toBe(employee.lastName);
    expect(String(apiEmployee.employeeId)).toBe(String(employee.employeeId));
    return apiEmployee;
  }
}
