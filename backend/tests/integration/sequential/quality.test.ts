import { Connection, createConnection, Repository } from "typeorm";
import { QualityReport } from "../../../src/entity/QualityReport";
import axios from "axios";
import { backendPrivateUrl, backendPublicUrl } from "../../lib";
import { promises as fsp } from "fs";
import { FileQuality } from "../../../src/entity/FileQuality";

let conn: Connection;
let qualityReportRepo: Repository<QualityReport>;
let fileQualityRepo: Repository<FileQuality>;
const privateUrl = `${backendPrivateUrl}quality/`;
const publicUrl = `${backendPublicUrl}quality/`;
const fileUrl = `${backendPublicUrl}files/`;
const searchUrl = `${backendPublicUrl}search/`;

const report = {
  qcVersion: "1.20",
  timestamp: "2022-08-26T10:37:31.374494Z",
  tests: [
    {
      testId: "TestUnits",
      description: "A longer description of the test",
      exceptions: [],
    },
    {
      testId: "TestDataTypes",
      description: "A longer description of the test",
      exceptions: [
        {
          result: "warning",
          variable: "count",
          expected: "int32",
          received: "float32",
        },
      ],
    },
    {
      testId: "TestDimensions",
      description: "A longer description of the test",
      exceptions: [
        {
          result: "error",
        },
      ],
    },
    {
      testId: "TestStandardNames",
      description: "A longer description of the test",
      exceptions: [
        {
          result: "warning",
          variable: "foo2",
          expected: "beta",
          received: "ateb",
        },
        {
          result: "error",
          variable: "foo3",
          expected: "beta",
          received: "ateb",
        },
        {
          result: "warning",
          variable: "foo4",
          expected: "dfff",
          received: "fadeff",
        },
      ],
    },
  ],
};

beforeAll(async () => {
  conn = await createConnection();
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
    await putReport(uuid);
    const res = await axios.get(searchUrl, { params: { dateFrom: "2020-12-05" } });
    expect(res.data[1].errorLevel).toEqual("error");
    // test that search_file table is updated
    const res2 = await axios.get(searchUrl, { params: { dateFrom: "2020-12-05" } });
    expect(res2.data[0].errorLevel).toEqual("error");
  });

  it("creates report for regular file (old report exist)", async () => {
    const uuid = "acf78456-11b1-41a6-b2de-aa7590a75675";
    await putReport(uuid);
    // test that individual test reports are sorted (error, warning, pass):
    const response = await axios.get(`${publicUrl}${uuid}`);
    await expect(response.data.testReports[0].result === "error");
    await expect(response.data.testReports[1].result === "error");
    await expect(response.data.testReports[2].result === "warning");
    await expect(response.data.testReports[3].result === "pass");
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

async function putReport(uuid: string) {
  await expect(axios.put(`${privateUrl}${uuid}`, report)).resolves.toMatchObject({
    status: 201,
  });
  await expect(axios.get(`${publicUrl}${uuid}`)).resolves.toMatchObject({
    status: 200,
    data: {
      uuid: uuid,
      errorLevel: "error",
      qcVersion: "1.20",
      timestamp: "2022-08-26T10:37:31.374Z",
      tests: 4,
      errors: 2,
      warnings: 1,
    },
  });
  return;
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
