import axios from "axios";
import { AppDataSource } from "../../../src/data-source";
import { MonitoringProduct } from "../../../src/entity/MonitoringProduct";
import { MonitoringProductVariable } from "../../../src/entity/MonitoringProductVariable";
import { InstrumentInfo } from "../../../src/entity/Instrument";
import { backendPrivateUrl } from "../../lib";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { Site } from "../../../src/entity/Site";
import { v4 as uuidv4 } from "uuid";

let monitoringProduct: MonitoringProduct;
let monitoringVariable: MonitoringProductVariable;
let instrument: InstrumentInfo;
let site: Site;
let predefinedUuid: string;
let generatedUuid: string;

beforeAll(async () => {
  const ds = await AppDataSource.initialize();
  const instrumentRepo = ds.getRepository(InstrumentInfo);
  const siteRepo = ds.getRepository(Site);
  const mpVarRepo = ds.getRepository(MonitoringProductVariable);

  site = await siteRepo.findOneByOrFail({ id: "hyytiala" });

  const variables = await mpVarRepo.find({
    relations: ["monitoringProduct"],
    take: 1,
  });

  monitoringVariable = variables[0];
  monitoringProduct = monitoringVariable.monitoringProduct;
  instrument = await instrumentRepo.findOneOrFail({ where: {} });

  predefinedUuid = uuidv4(); // used in user-supplied UUID test
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Monitoring file creation and visualization upload", () => {
  it("creates a monitoring file with a client-supplied UUID", async () => {
    const payload = {
      uuid: predefinedUuid,
      siteId: site.id,
      instrumentUuid: instrument.uuid,
      productId: monitoringProduct.id,
      startDate: "2022-01-01",
      periodType: "month",
    };

    const res = await axios.post(`${backendPrivateUrl}monitoring-files`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
    expect(res.data.uuid).toBe(predefinedUuid);
  });

  it("uploads a visualization for the predefined UUID", async () => {
    const payload = {
      s3key: "monitoring/test/with-predefined.svg",
      sourceFileUuid: predefinedUuid,
      variableId: monitoringVariable.id,
      width: 800,
      height: 400,
    };

    const res = await axios.post(`${backendPrivateUrl}monitoring-visualizations`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
  });

  it("creates monitoring file with a generated UUID (server assigns it)", async () => {
    const payload = {
      siteId: site.id,
      instrumentUuid: instrument.uuid,
      productId: monitoringProduct.id,
      startDate: "2023-05-01",
      periodType: "month",
    };

    const res = await axios.post(`${backendPrivateUrl}monitoring-files`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
    expect(res.data.uuid).toBeDefined();
    generatedUuid = res.data.uuid;
  });

  it("uploads a visualization for the auto-generated UUID", async () => {
    const payload = {
      s3key: "monitoring/test/with-generated.svg",
      sourceFileUuid: generatedUuid,
      variableId: monitoringVariable.id,
      width: 600,
      height: 300,
    };

    const res = await axios.post(`${backendPrivateUrl}monitoring-visualizations`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(201);
  });
});

describe("Negative tests for monitoring visualizations", () => {
  it("rejects upload without sourceFileUuid", async () => {
    const badPayload = {
      s3key: "monitoring/test/invalid.svg",
      variableId: monitoringVariable.id,
      width: 400,
      height: 200,
    };

    await expect(
      axios.post(`${backendPrivateUrl}monitoring-visualizations`, badPayload, {
        headers: { "Content-Type": "application/json" },
      }),
    ).rejects.toThrow("Request failed with status code 400");
  });

  it("rejects upload if s3 key does not start with monitoring/", async () => {
    const badS3keyPayload = {
      sourceFileUuid: generatedUuid,
      s3key: "notmonitoring/test/invalid.svg",
      variableId: monitoringVariable.id,
      width: 400,
      height: 200,
    };

    await expect(
      axios.post(`${backendPrivateUrl}monitoring-visualizations`, badS3keyPayload, {
        headers: { "Content-Type": "application/json" },
      }),
    ).rejects.toThrow("Request failed with status code 400");
  });

  it("rejects upload with non-existent sourceFileUuid", async () => {
    const fakeUuid = uuidv4();
    const badPayload = {
      s3key: "monitoring/test/fake-uuid.svg",
      sourceFileUuid: fakeUuid,
      variableId: monitoringVariable.id,
      width: 400,
      height: 200,
    };

    await expect(
      axios.post(`${backendPrivateUrl}monitoring-visualizations`, badPayload, {
        headers: { "Content-Type": "application/json" },
      }),
    ).rejects.toThrow("Request failed with status code 400");
  });
});
