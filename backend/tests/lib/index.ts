import * as fs from "node:fs";
import { resolve } from "node:path";
import axios from "axios";
import { AppDataSource } from "../../src/data-source";

if (!process.env.DP_BACKEND_URL) throw new Error("DP_BACKEND_URL must be set");
if (!process.env.DP_FRONTEND_URL) throw new Error("DP_FRONTEND_URL must be set");
if (!process.env.DP_SS_TEST_URL) throw new Error("DP_SS_TEST_URL must be set");

export async function clearRepo(repo: string) {
  const dataSource = await AppDataSource.initialize();
  await dataSource.getRepository(repo).createQueryBuilder().delete().execute();
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
