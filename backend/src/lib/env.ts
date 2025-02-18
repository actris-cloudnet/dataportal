import { URL } from "node:url";
import * as ipaddr from "ipaddr.js";

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
  "TYPEORM_MIGRATIONS",
  "TYPEORM_MIGRATIONS_RUN",
  "TYPEORM_LOGGING",
  "TYPEORM_ENTITIES",
  "DVAS_URL",
  "DC_URL",
] as const;

type RequiredVar = (typeof requiredVars)[number];

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
  TYPEORM_MIGRATIONS: string;
  TYPEORM_MIGRATIONS_RUN: boolean;
  TYPEORM_LOGGING: boolean;
  TYPEORM_ENTITIES: string;
  MATOMO_HOST?: string;
  MATOMO_TOKEN?: string;
  MATOMO_SITE_ID?: number;
  MATOMO_START_DATE?: string;
  SLACK_API_TOKEN?: string;
  SLACK_NOTIFICATION_CHANNEL?: string;
  DVAS_URL: string;
  DC_URL: string;
  PRIVATE_IP_RANGES: [ipaddr.IPv4 | ipaddr.IPv6, number][];
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
  TYPEORM_SYNCHRONIZE: readBoolean(rawEnv.TYPEORM_SYNCHRONIZE),
  TYPEORM_MIGRATIONS_RUN: readBoolean(rawEnv.TYPEORM_MIGRATIONS_RUN),
  TYPEORM_LOGGING: readBoolean(rawEnv.TYPEORM_LOGGING),
  MATOMO_HOST: typeof rawEnv.MATOMO_HOST !== "undefined" ? readUrl(rawEnv.MATOMO_HOST) : undefined,
  MATOMO_SITE_ID: typeof rawEnv.MATOMO_SITE_ID !== "undefined" ? readInteger(rawEnv.MATOMO_SITE_ID) : undefined,
  MATOMO_START_DATE:
    typeof rawEnv.MATOMO_START_DATE !== "undefined" ? readIsoDate(rawEnv.MATOMO_START_DATE) : undefined,
  DVAS_URL: readUrl(rawEnv.DVAS_URL),
  DC_URL: readUrl(rawEnv.DC_URL),
  PRIVATE_IP_RANGES: rawEnv.PRIVATE_IP_RANGES ? readIpRanges(rawEnv.PRIVATE_IP_RANGES) : [],
};

export default env;

function readInteger(input: string): number {
  const x = parseInt(input, 10);
  if (isNaN(x)) {
    throw new Error(`Invalid integer: ${input}`);
  }
  return x;
}

function readBoolean(input: string): boolean {
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
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
  return input.replace(/\/$/, "");
}

function readIsoDate(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || isNaN(new Date(input).valueOf())) {
    throw new Error(`Invalid URL: ${input}`);
  }
  return input;
}

function readIpRanges(input: string) {
  return input.split(",").map((s) => ipaddr.parseCIDR(s.trim()));
}
