import { existsSync, readFileSync } from "fs";
import { userInfo } from "os";
import { join } from "path";

const DEFAULT_BASE_URL =
  "https://opensource-demo.orangehrmlive.com/web/index.php/";
const DEFAULT_USERNAME = "Admin";
const DEFAULT_PASSWORD = "admin123";

function readLocalEnv() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return {};
  }

  const contents = readFileSync(envPath, "utf8");
  const variables = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    variables[key.trim()] = value.replace(/^['"]|['"]$/g, "");
  }

  return variables;
}

const localEnv = readLocalEnv();

function getBaseUrl() {
  const baseUrl = process.env.BASE_URL || DEFAULT_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function getLoginCredentials() {
  const systemUser = userInfo().username || process.env.USERNAME;
  const envUsername = process.env.USERNAME;
  const envPassword = process.env.PASSWORD;
  const localUsername = localEnv.USERNAME;
  const localPassword = localEnv.PASSWORD;

  const username =
    localUsername && envUsername && envUsername === systemUser ? localUsername :
    envUsername && envUsername !== systemUser ? envUsername :
    localUsername || envUsername;

  const password =
    localPassword && envUsername && envUsername === systemUser ? localPassword :
    envPassword || localPassword;

  if (username && password) {
    return { username, password };
  }

  if (!username && !password) {
    return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
  }

  throw new Error("Set both USERNAME and PASSWORD, or leave both unset.");
}

export { getBaseUrl, getLoginCredentials };
export default { getBaseUrl, getLoginCredentials };
