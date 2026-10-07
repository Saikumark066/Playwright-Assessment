// This base helper wraps all Playwright API requests with a consistent JSON response check.
// We centralize response validation here so every API client can fail fast with the same error handling.
export class BaseApi {
  constructor(request) {
    this.request = request;
  }

  // Validates the HTTP status code and parses the JSON body.
  // We use this helper to ensure API tests fail with a clear message instead of opaque parsing errors.
  async parse(response) {
    if (!response.ok()) {
      throw new Error(`API request failed with HTTP ${response.status()}.`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('API response did not contain valid JSON.', { cause: error });
    }
  }

  // Extracts the top-level data field from the API response.
  // This is used by all API methods because the OrangeHRM REST API returns payloads wrapped in a data object.
  async parseData(response) {
    const body = await this.parse(response);
    if (!body || typeof body !== 'object' || !Object.hasOwn(body, 'data')) {
      throw new Error('API response is missing the data field.');
    }
    return body.data;
  }
}
