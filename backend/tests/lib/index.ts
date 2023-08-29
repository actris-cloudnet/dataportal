import * as fs from "fs";
import { resolve } from "path";
import axios from "axios";
import { expect } from "@jest/globals";
import { AppDataSource } from "../../src/data-source";

if (!process.env.DP_BACKEND_URL) throw new Error("DP_BACKEND_URL must be set");
if (!process.env.DP_FRONTEND_URL) throw new Error("DP_FRONTEND_URL must be set");
if (!process.env.DP_SS_TEST_URL) throw new Error("DP_SS_TEST_URL must be set");

export async function clearRepo(repo: string) {
  const dataSource = await AppDataSource.initialize();
  await dataSource.getRepository(repo).delete({});
  await dataSource.destroy();
}

export async function putFile(filename: string) {
  await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${filename}`, "content");
  await axios.put(`${storageServiceUrl}cloudnet-product/${filename}`, "content");
  const json = JSON.parse(fs.readFileSync(`tests/data/${filename}.json`, "utf8"));
  const url = `${backendPrivateUrl}files/${filename}`;
  return await axios.put(url, json);
}

export const wait = async (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms));

export const genResponse = (status: any, data: any) => ({ response: { status, data } });

const backendUrl = process.env.DP_BACKEND_URL.replace("/api", "");
export const backendPublicUrl = `${backendUrl}/api/`;
export const backendPrivateUrl = `${backendUrl}/`;
export const frontendUrl = `${process.env.DP_FRONTEND_URL}/`;
export const storageServiceUrl = `${process.env.DP_SS_TEST_URL}/`;
export const visualizationPayloads = [
  {
    s3key: resolve("tests/data/20200501_bucharest_classification_detection_status.png"),
    sourceFileId: "7a9c3894ef7e43d9aa7da3f25017acec",
    variableId: "classification-detection_status",
  },
  {
    s3key: resolve("tests/data/20200501_bucharest_classification_target_classification.png"),
    sourceFileId: "7a9c3894ef7e43d9aa7da3f25017acec",
    variableId: "classification-target_classification",
  },
];

export const str2base64 = (hex: string) => Buffer.from(hex, "utf8").toString("base64");

expect.extend({
  toBeAround(received: number, expected: number, precision: number = 2) {
    const pass = Math.abs(expected - received) < Math.pow(10, -precision) / 2;
    if (pass) {
      return {
        message: () => `expected ${received} not to be around ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be around ${expected}`,
        pass: false,
      };
    }
  },
});

interface CustomMatchers<R = unknown> {
  toBeAround(expected: number, precision?: number): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}
