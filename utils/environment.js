import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// This file centralizes environment configuration for the entire Playwright suite.
// We load the base URL and login credentials here so every page object and test can use the same environment setup without duplication.
const DEFAULT_BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/';
const SUPPORTED_ENVIRONMENTS = new Set(['demo', 'dev', 'qa', 'stage']);
const originalEnvironment = new Map(Object.entries(process.env));

function readEnvironmentFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return dotenv.parse(fs.readFileSync(filePath));
}

dotenv.config();
const selectedEnvironment = process.env.TEST_ENV || 'demo';
if (!SUPPORTED_ENVIRONMENTS.has(selectedEnvironment)) {
  throw new Error(`Unsupported TEST_ENV "${selectedEnvironment}". Use demo, dev, qa, or stage.`);
}

const rootEnvironment = readEnvironmentFile(path.resolve('.env'));
const profileEnvironment = readEnvironmentFile(path.resolve(`.env.${selectedEnvironment}`));
dotenv.config({ path: path.resolve(`.env.${selectedEnvironment}`), override: true });
for (const [key, value] of originalEnvironment) {
  process.env[key] = value;
}

// Returns the active environment name so tests can branch on demo/dev/qa/stage without hard-coded values.
export function getEnvironmentName() {
  return process.env.TEST_ENV || selectedEnvironment;
}

// Resolves the base URL for the selected environment.
// We use this everywhere to guarantee all pages, API calls, and browser contexts hit the same configured app instance.
export function getBaseUrl() {
  const profileUrl = process.env[`${getEnvironmentName().toUpperCase()}_BASE_URL`];
  const value = profileUrl || process.env.BASE_URL || (
    getEnvironmentName() === 'demo'
      ? DEFAULT_BASE_URL
      : undefined
  );
  if (!value) {
    throw new Error(`Configure ${getEnvironmentName().toUpperCase()}_BASE_URL or BASE_URL for this environment.`);
  }
  return value.endsWith('/') ? value : `${value}/`;
}

// Reads the current login credentials from the active environment or root .env files.
// We centralize credential lookup here so tests do not duplicate environment logic and can run in CI/security-safe configuration.
export function getLoginCredentials() {
  const environmentPrefix = getEnvironmentName().toUpperCase();
  const username = process.env[`${environmentPrefix}_USERNAME`]
    || process.env.ORANGEHRM_USERNAME
    || profileEnvironment[`${environmentPrefix}_USERNAME`]
    || profileEnvironment.ORANGEHRM_USERNAME
    || profileEnvironment.USERNAME
    || rootEnvironment[`${environmentPrefix}_USERNAME`]
    || rootEnvironment.ORANGEHRM_USERNAME
    || rootEnvironment.USERNAME
    || (originalEnvironment.get('USERNAME') && process.env.USERNAME);
  const password = process.env[`${environmentPrefix}_PASSWORD`]
    || process.env.ORANGEHRM_PASSWORD
    || originalEnvironment.get('PASSWORD')
    || profileEnvironment[`${environmentPrefix}_PASSWORD`]
    || profileEnvironment.ORANGEHRM_PASSWORD
    || profileEnvironment.PASSWORD
    || rootEnvironment[`${environmentPrefix}_PASSWORD`]
    || rootEnvironment.ORANGEHRM_PASSWORD
    || rootEnvironment.PASSWORD
    || process.env.PASSWORD;

  if (!username || !password) {
    throw new Error('USERNAME and PASSWORD must be configured in .env or CI secrets.');
  }

  return { username, password };
}

// Returns the configured worker count to scale Playwright execution safely.
// We keep this wrapper here so the config can read a single source of truth for parallelism.
export function getWorkers() {
  const configured = Number(process.env.WORKERS ?? '1');
  if (!Number.isInteger(configured) || configured < 1) {
    throw new Error('WORKERS must be a positive integer.');
  }
  return configured;
}
