import { Connection, createConnection, Repository } from "typeorm";
import { QualityReport } from "../../../src/entity/QualityReport";
import axios from "axios";
import { backendPrivateUrl, backendPublicUrl } from "../../lib";
import { promises as fsp } from "fs";
import { FileQuality } from "../../../src/entity/FileQuality";
import { readResources } from "../../../../shared/lib";
import { TestInfo } from "../../../src/entity/TestInfo";

let conn: Connection;
let testInfoRepo: Repository<TestInfo>;
let qualityReportRepo: Repository<QualityReport>;
let fileQualityRepo: Repository<FileQuality>;
const privateUrl = `${backendPrivateUrl}quality/`;
const publicUrl = `${backendPublicUrl}quality/`;
const fileUrl = `${backendPublicUrl}files/`;
const searchUrl = `${backendPublicUrl}search/`;
let resources: any;
let report: any;

beforeAll(async () => {
  resources = await readResources();
  conn = await createConnection();
  testInfoRepo = await conn.getRepository("test_info");
  qualityReportRepo = await conn.getRepository("quality_report");
  fileQualityRepo = await conn.getRepository("file_quality");
});

beforeEach(async () => {
  await cleanRepos();
  await conn
    .getRepository("regular_file")
    .save(JSON.parse((await fsp.readFile("fixtures/2-regular_file.json")).toString()));
  await conn
    .getRepository("model_file")
    .save(JSON.parse((await fsp.readFile("fixtures/2-model_file.json")).toString()));
  await conn
    .getRepository("search_file")
    .save(JSON.parse((await fsp.readFile("fixtures/2-search_file.json")).toString()));
  await testInfoRepo.save(JSON.parse((await fsp.readFile("fixtures/0-test_info.json")).toString()));
});

afterAll(async () => {
  await cleanRepos();
  await conn.close();
});

describe("PUT /quality/:uuid", () => {
  it("fails with 400 if file does not exist", async () => {
    await expect(axios.put(`${privateUrl}4FC4577C-84BF-4557-86D8-1A1FB8D1D81E`, report)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("creates new report for model file (no prior report)", async () => {
    const res1 = await axios.get(searchUrl, { params: { dateFrom: "2020-12-05" } });
    expect(res1.data[1].errorLevel).toEqual(null);
    const uuid = "b5d1d5af-3667-41bc-b952-e684f627d91c";
    await putReportWithErrors(uuid);
    const res = await axios.get(searchUrl, { params: { dateFrom: "2020-12-05" } });
    expect(res.data[1].errorLevel).toEqual("error");
    // test that search_file table is updated
    const res2 = await axios.get(searchUrl, { params: { dateFrom: "2020-12-05" } });
    expect(res2.data[0].errorLevel).toEqual("error");
  });

  it("creates report for regular file (old report exist)", async () => {
    const uuid = "acf78456-11b1-41a6-b2de-aa7590a75675";
    await putReportWithErrors(uuid);
    const response = await axios.get(`${publicUrl}${uuid}`);
    expect(response.status).toEqual(200);
    expect(response.data).toMatchSnapshot();
  });

  it("works with warnings only report", async () => {
    const uuid = "acf78456-11b1-41a6-b2de-aa7590a75675";
    await putReportWithWarnings(uuid);
    const response = await axios.get(`${publicUrl}${uuid}`);
    expect(response.status).toEqual(200);
    expect(response.data).toMatchSnapshot();
  });

  it("works with passing report", async () => {
    const uuid = "acf78456-11b1-41a6-b2de-aa7590a75675";
    await putReportWithPasses(uuid);
    const response = await axios.get(`${publicUrl}${uuid}`);
    expect(response.status).toEqual(200);
    expect(response.data).toMatchSnapshot();
  });

  it("doesn't update file's updatedAt when creating or updating report", async () => {
    await expect(axios.get(`${fileUrl}acf78456-11b1-41a6-b2de-aa7590a75675`)).resolves.toMatchObject({
      status: 200,
      data: { updatedAt: "2021-02-22T10:39:58.449Z" },
    });
    await expect(axios.put(`${privateUrl}acf78456-11b1-41a6-b2de-aa7590a75675`, report)).resolves.toMatchObject({
      status: 201,
    });
    await expect(axios.get(`${fileUrl}acf78456-11b1-41a6-b2de-aa7590a75675`)).resolves.toMatchObject({
      status: 200,
      data: { updatedAt: "2021-02-22T10:39:58.449Z" },
    });
  });
});

async function putReportWithErrors(uuid: string) {
  report = resources["quality-report-error"];
  await expect(axios.put(`${privateUrl}${uuid}`, report)).resolves.toMatchObject({
    status: 201,
  });
}

async function putReportWithWarnings(uuid: string) {
  report = resources["quality-report-warning"];
  await expect(axios.put(`${privateUrl}${uuid}`, report)).resolves.toMatchObject({
    status: 201,
  });
}

async function putReportWithPasses(uuid: string) {
  report = resources["quality-report-pass"];
  await expect(axios.put(`${privateUrl}${uuid}`, report)).resolves.toMatchObject({
    status: 201,
  });
}

async function cleanRepos() {
  await qualityReportRepo.delete({});
  await fileQualityRepo.delete({});
  await conn.getRepository("visualization").delete({});
  await conn.getRepository("model_visualization").delete({});
  await conn.getRepository("regular_file").delete({});
  await conn.getRepository("model_file").delete({});
  await conn.getRepository("search_file").delete({});
  return;
}
