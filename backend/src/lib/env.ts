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
}

const env: Env = {
  ...rawEnv,
  DP_SS_HOST: ssUrl.hostname,
  DP_SS_PORT: parseInt(ssUrl.port),
  DATACITE_API_URL: rawEnv.DATACITE_API_URL.replace(/\/$/, ""),
  DATACITE_API_TIMEOUT_MS: parseInt(rawEnv.DATACITE_API_TIMEOUT_MS),
  DATACITE_DOI_SERVER: rawEnv.DATACITE_DOI_SERVER.replace(/\/$/, ""),
};

export default env;
