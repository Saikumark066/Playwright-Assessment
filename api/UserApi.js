import { BaseApi } from './BaseApi.js';

// This client wraps the admin user REST API used for ESS-role fixtures and RBAC checks.
// We keep user creation and lookup here so the tests can create role-specific users without duplicating HTTP logic.
export class UserApi extends BaseApi {
  constructor(request) {
    super(request);
    this.endpoint = 'api/v2/admin/users';
  }

  // Resolves the role identifier for the ESS user type.
  // This is required in the RBAC fixture because the app creates users with a specific role ID.
  async getEssRoleId() {
    const response = await this.request.get(this.endpoint, {
      params: { limit: 100, offset: 0 },
    });
    const users = await this.parseData(response);
    if (!Array.isArray(users)) {
      throw new Error('Admin user response data must be an array.');
    }
    const essUser = users.find((user) => user.userRole?.name === 'ESS');
    if (!essUser?.userRole?.id) {
      throw new Error('No existing ESS user was found to resolve the ESS role ID.');
    }
    return essUser.userRole.id;
  }

  // Creates a new admin user record using the API.
  // We use this in RBAC setup so the test can create a real ESS account and validate permissions.
  async createUser(user) {
    const response = await this.request.post(this.endpoint, { data: user });
    return this.parseData(response);
  }

  // Deletes a user by id after the test finishes.
  // This keeps the RBAC fixture isolated so no extra accounts remain behind for later tests.
  async deleteUser(userId) {
    const response = await this.request.delete(this.endpoint, { data: { ids: [userId] } });
    return this.parse(response);
  }
}
