import * as fs from "node:fs";
import { resolve } from "node:path";
import axios from "axios";
import { AppDataSource } from "../../src/data-source";
import { DataSource } from "typeorm";
import { promises as fsp } from "node:fs";

if (!process.env.DP_BACKEND_URL) throw new Error("DP_BACKEND_URL must be set");
if (!process.env.DP_FRONTEND_URL) throw new Error("DP_FRONTEND_URL must be set");
if (!process.env.DP_SS_TEST_URL) throw new Error("DP_SS_TEST_URL must be set");

export async function clearRepo(repo: string) {
  const dataSource = await AppDataSource.initialize();
  await dataSource.getRepository(repo).createQueryBuilder().delete().execute();
  await dataSource.destroy();
}

export async function cleanRepos(dataSource: DataSource) {
  await dataSource.query('TRUNCATE TABLE "download" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "task" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "visualization" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model_visualization" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "monitoring_visualization" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "quality_report" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "file_quality" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "collection" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument_log_permission" RESTART IDENTITY CASCADE');

  await dataSource.query('TRUNCATE TABLE "user_account" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "search_file" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "regular_file_software_software" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "regular_file" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model_file_software_software" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model_file" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "monitoring_file" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "publication" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument_log" RESTART IDENTITY CASCADE');

  await dataSource.query('TRUNCATE TABLE "nominal_instrument" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "monitoring_product_variable" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model_upload" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument_upload" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument_contact" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "calibration" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "site_contact" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "product_variable" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument_info" RESTART IDENTITY CASCADE');

  await dataSource.query('TRUNCATE TABLE "site_location" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "person" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "permission" RESTART IDENTITY CASCADE');

  await dataSource.query('TRUNCATE TABLE "site" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "product" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "monitoring_product" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "news_item" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "instrument" RESTART IDENTITY CASCADE');

  await dataSource.query('TRUNCATE TABLE "test_info" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "software" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "regular_citation" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "model_citation" RESTART IDENTITY CASCADE');
}

export async function loadFixture(dataSource: DataSource, fixture: string) {
  const repository = fixture.split("-")[1];
  const filename = `fixtures/${fixture}.json`;
  const entities = JSON.parse((await fsp.readFile(filename)).toString());
  await dataSource.getRepository(repository).save(entities);
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
