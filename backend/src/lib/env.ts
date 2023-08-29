import { URL } from "url";

const requiredVars = [
  "NODE_ENV",
  "DP_SS_URL",
  "DP_SS_USER",
  "DP_SS_PASSWORD",
  "DP_BACKEND_URL",
  "DP_FRONTEND_URL",
  "GEOLITE2_COUNTRY_PATH",
  "CITATION_SERVICE_URL",
  "DATACITE_API_URL",
  "DATACITE_API_USERNAME",
  "DATACITE_API_PASSWORD",
  "DATACITE_API_TIMEOUT_MS",
  "DATACITE_DOI_SERVER",
  "DATACITE_DOI_PREFIX",
  "LABELLING_URL",
  "HANDLE_API_URL",
  "TYPEORM_HOST",
  "TYPEORM_USERNAME",
  "TYPEORM_PASSWORD",
  "TYPEORM_DATABASE",
  "TYPEORM_PORT",
  "TYPEORM_SYNCHRONIZE",
] as const;

type RequiredVar = typeof requiredVars[number];

const missingVars = requiredVars.filter((env) => !process.env[env]);
if (missingVars.length > 0) {
  throw new Error(`FATAL: Following environment variables must be set: ${missingVars.join(", ")}`);
}

const rawEnv = process.env as NodeJS.ProcessEnv & Record<RequiredVar, string>;
const ssUrl = new URL(rawEnv.DP_SS_URL);

interface Env {
  NODE_ENV: string;
  DP_SS_URL: string;
  DP_SS_HOST: string;
  DP_SS_PORT: number;
  DP_SS_USER: string;
  DP_SS_PASSWORD: string;
  DP_BACKEND_URL: string;
  DP_FRONTEND_URL: string;
  GEOLITE2_COUNTRY_PATH: string;
  CITATION_SERVICE_URL: string;
  DATACITE_API_URL: string;
  DATACITE_API_USERNAME: string;
  DATACITE_API_PASSWORD: string;
  DATACITE_API_TIMEOUT_MS: number;
  DATACITE_DOI_SERVER: string;
  DATACITE_DOI_PREFIX: string;
  LABELLING_URL: string;
  HANDLE_API_URL: string;
  TYPEORM_HOST: string;
  TYPEORM_USERNAME: string;
  TYPEORM_PASSWORD: string;
  TYPEORM_DATABASE: string;
  TYPEORM_PORT: number;
  TYPEORM_SYNCHRONIZE: boolean;
}

const env: Env = {
  ...rawEnv,
  DP_SS_HOST: ssUrl.hostname,
  DP_SS_PORT: parseInt(ssUrl.port),
  DATACITE_API_URL: readUrl(rawEnv.DATACITE_API_URL),
  DATACITE_API_TIMEOUT_MS: readInteger(rawEnv.DATACITE_API_TIMEOUT_MS),
  DATACITE_DOI_SERVER: readUrl(rawEnv.DATACITE_DOI_SERVER),
  LABELLING_URL: readUrl(rawEnv.LABELLING_URL),
  HANDLE_API_URL: readUrl(rawEnv.HANDLE_API_URL),
  TYPEORM_PORT: readInteger(rawEnv.TYPEORM_PORT),
  TYPEORM_SYNCHRONIZE: readString(rawEnv.TYPEORM_SYNCHRONIZE),
};

export default env;

function readInteger(input: string): number {
  const x = parseInt(input, 10);
  if (isNaN(x)) {
    throw new Error(`Invalid integer: ${input}`);
  }
  return x;
}

function readString(input: string): boolean {
  if (input === "true") {
    return true;
  }
  if (input === "false") {
    return false;
  }
  throw new Error(`Invalid boolean: ${input}`);
}

function readUrl(input: string): string {
  try {
    new URL(input);
  } catch (e) {
    throw new Error(`Invalid URL: ${input}`);
  }
  return input.replace(/\/$/, "");
}
