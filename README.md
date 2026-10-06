# Playwright Assessment

Playwright end-to-end and API checks for the OrangeHRM demo application.

## Setup

Requirements: Node.js 22 or newer and npm.

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

The example environment file uses the public OrangeHRM demo URL and its published
demo account. Replace these values when targeting a private test environment.
`BASE_URL` should include the application's `/web/index.php/` path. Set both
`USERNAME` and `PASSWORD`, or leave both unset to use the public demo account.
The `.env` file is ignored by Git; never commit credentials or other secrets.

## Execution

```powershell
npm test                 # Full suite
npm run test:smoke       # Tests tagged @smoke
npm run test:parallel    # Read-only smoke checks with two workers
npm run test:headed      # Run with a visible browser
npm run test:debug       # Launch Playwright Inspector
npm run test:repeat      # Repeat tests to help expose intermittent failures
npm run test:report      # Open the latest HTML report
npx playwright test tests/employee.spec.js # Disabled employee-login scenario
```

Playwright also accepts `BASE_URL`, `USERNAME`, `PASSWORD`, and `WORKERS` from
the shell environment. In PowerShell, for example, set a worker override with
`$env:WORKERS = "2"` before running `npm test`; CI deliberately forces one
worker for the shared demo account. Local runs default to one worker and no
retries so intermittent issues are visible rather than hidden.

## Tags

Tests use title tags to allow focused runs:

- `@smoke`: basic login, page availability, or read-only employee checks
- `@auth`: successful authentication behavior
- `@negative`: invalid or missing input behavior
- `@employee` / `@crud`: employee workflows
- `@api`: API-backed tests
- `@parallel-safe`: read-only tests suitable for concurrent execution
- `@ci-retry`: a controlled CI-only retry demonstration

Use `npx playwright test --grep @api` (or any tag) to select tests. In CI,
`@ci-retry` intentionally fails its first attempt and passes on retry to verify
that retry evidence is collected.

The disabled-login test creates an employee and a disabled application account
with unique test data. Run it against a disposable or dedicated test
environment; it adds a record to the configured OrangeHRM instance.

## Flaky-test mitigation and CI artifacts

The public demo is shared, so the default and CI worker count is one. The
parallel check repeats only the read-only login-page availability test with
two workers. Authenticated checks against the shared demo timed out when run
concurrently, so full runs and CI stay serialized. Prefer independent test
data and Playwright's per-test browser contexts if adding mutating scenarios.

CI retries failures twice and captures a trace on the first retry, screenshots
on failure, and videos retained for failures. Investigate these artifacts before
adding or increasing retries: retries are diagnostic and do not replace fixing
timing, data-isolation, or synchronization problems. Local runs use zero retries
to expose flakes promptly.

Each run creates an HTML report in `playwright-report/` and a machine-readable
JSON report plus failure evidence in `test-results/`. The GitHub Actions workflow
uploads both directories as the `playwright-report-and-results` artifact even
when tests fail; the upload step errors if no report or result files are found.

## Design decisions

- Page objects keep login and employee interactions reusable across UI tests.
- `utils/environment.js` centralizes the demo defaults and rejects partially
  configured credentials.
- Environment variables are loaded from `.env` by Playwright's configuration
  using `dotenv`; CI environment values override the local file.
- The `@smoke` selection and explicit worker override provide a safe way to
  probe parallel stability while keeping normal runs serialized.
