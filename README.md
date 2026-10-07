# Playwright Assessment — OrangeHRM

A Playwright JavaScript framework demonstrating UI automation, API validation, worker-scoped authentication, fixture-managed test data, RBAC coverage, parallel CI sharding, and failure reporting.

## Architecture

```text
api/          REST API clients and response handling
data/         Business test-data builders
fixtures/     Authentication, page objects, API clients, and cleanup
pages/        UI page objects
tests/        Authentication, employee, API, and RBAC scenarios
utils/        Environment, constants, ID generation, and reporting tools
.github/      CI workflow and report handling
```

## Setup

Requirements: Node.js 22+ and npm.

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

Set `ORANGEHRM_USERNAME` and `ORANGEHRM_PASSWORD` in `.env` or environment variables. The ESS fixture generates a unique strong password unless an environment-specific `ESS_PASSWORD` override is configured. Prefer `ORANGEHRM_USERNAME` over `USERNAME`, which is predefined by Windows and can otherwise silently override the configured OrangeHRM account. Do not commit credentials.

The default environment is `demo`. For other environments, set `TEST_ENV` to `dev`, `qa`, or `stage` and provide a matching ignored `.env.<environment>` file. Environment-specific keys such as `QA_BASE_URL`, `QA_USERNAME`, `QA_PASSWORD`, and `QA_ESS_PASSWORD` take priority over generic keys; `BASE_URL`, `ORANGEHRM_USERNAME`, `ORANGEHRM_PASSWORD`, and `ESS_PASSWORD` can also be set in the selected profile file. Legacy `USERNAME` and `PASSWORD` keys remain supported in profile files. The demo URL is the only built-in URL.

## Execution

```text
npm test
npm run test:smoke
npm run test:api
npm run test:rbac
npm run test:parallel
npm run test:repeat
npm run test:analyze-flakes
npm run test:headed
npm run test:debug
npm run test:report
npm run lint
```

## Fixture and data lifecycle

Authentication is established once per worker and saved as Playwright `storageState`. Tests use isolated browser contexts rather than repeating the Admin UI login for each test.

The `employee` fixture creates an employee through the API and removes it during teardown, including when a test fails. The `essUser` fixture similarly tracks and removes its API-created account and employee, including failures during setup. Tests that create employees directly also clean them up in `finally` blocks.

## API strategy

`api/EmployeeApi.js` and `api/UserApi.js` provide API operations and response parsing, not test assertions. Non-success HTTP responses and malformed response bodies raise explicit errors. Tests own business assertions.

The employee API operations use the OrangeHRM contract:

- `POST /api/v2/pim/employees` — create
- `GET /api/v2/pim/employees/{empNumber}` — read by employee number
- `GET /api/v2/pim/employees?employeeId=...` — search by business Employee ID
- `PUT /api/v2/pim/employees/{empNumber}/personal-details` — update
- `DELETE /api/v2/pim/employees` with `{ ids: [...] }` — delete

Employee ID searches request one exact result rather than scanning a sorted page of records.

## Test coverage

The employee scenarios cover UI creation, API setup, read, update and delete, API CRUD, and a single UI lifecycle that verifies API state after update and deletion. RBAC coverage creates an ESS user, verifies the Admin and ESS navigation difference, and checks that direct PIM navigation does not grant access.

## CI/CD and reports

GitHub Actions runs lint and a two-shard Playwright matrix. Each shard produces JSON, JUnit, and Blob reports; a follow-up job merges the Blob reports into an HTML report. Shard summaries include pass/fail counts and retry-based flaky candidates. Artifacts are uploaded even when tests fail.

Manual workflow runs accept `demo`, `dev`, `qa`, or `stage`. Configure a matching GitHub Environment and its `BASE_URL`, `ORANGEHRM_USERNAME`, `ORANGEHRM_PASSWORD`, and `ESS_PASSWORD` secrets. Pull requests and pushes use the `demo` Environment.

Retries are enabled only in CI. Screenshots are captured on failure, traces on the first retry, and videos are retained on failure. `--repeat-each` is available for local investigation; `utils/analyze-flakes.js` reports tests that fail and later pass.

## Test tagging and design decisions

Tests use Playwright's native `tag` option. Tags include `@smoke`, `@auth`, `@negative`, `@crud`, `@api`, `@rbac`, and `@parallel-safe`.

1. UI page objects contain UI behavior only.
2. API clients handle HTTP operations and response parsing; tests make assertions.
3. Fixtures own authentication and test-data lifecycle.
4. Data is generated centrally and mutation tests clean up after themselves.
5. Critical checks use hard assertions.
6. CI parallelism is enabled with sharding and unique per-test data.
