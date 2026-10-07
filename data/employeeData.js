import { buildEmployee } from '../utils/testData.js';

export function newEmployee(overrides = {}) {
  return buildEmployee(overrides);
}

export function updatedEmployee(employee) {
  return {
    ...employee,
    firstName: 'Updated',
    middleName: 'Edited',
    lastName: 'Employee',
  };
}
