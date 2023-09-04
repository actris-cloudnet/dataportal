import { DataSource, Repository } from "typeorm";
import { QualityReport } from "../../../src/entity/QualityReport";
import axios from "axios";
import { backendPrivateUrl, backendPublicUrl } from "../../lib";
import { promises as fsp } from "fs";
import { ErrorLevel, FileQuality } from "../../../src/entity/FileQuality";
import { readResources } from "../../../../shared/lib";
import { TestInfo } from "../../../src/entity/TestInfo";
import { AppDataSource } from "../../../src/data-source";
import { ModelFile, RegularFile } from "../../../src/entity/File";
import { SearchFile } from "../../../src/entity/SearchFile";
import { ModelVisualization } from "../../../src/entity/ModelVisualization";
import { Visualization } from "../../../src/entity/Visualization";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let testInfoRepo: Repository<TestInfo>;
let qualityReportRepo: Repository<QualityReport>;
let fileQualityRepo: Repository<FileQuality>;
let regularFileRepo: Repository<RegularFile>;
let modelFileRepo: Repository<SearchFile>;
let searchFileRepo: Repository<SearchFile>;
const privateUrl = `${backendPrivateUrl}quality/`;
const publicUrl = `${backendPublicUrl}quality/`;
const fileUrl = `${backendPublicUrl}files/`;
let resources: any;
let report: any;

beforeAll(async () => {
  resources = await readResources();
  dataSource = await AppDataSource.initialize();
  testInfoRepo = dataSource.getRepository(TestInfo);
  qualityReportRepo = dataSource.getRepository(QualityReport);
  fileQualityRepo = dataSource.getRepository(FileQuality);
  regularFileRepo = dataSource.getRepository(RegularFile);
  modelFileRepo = dataSource.getRepository(ModelFile);
  searchFileRepo = dataSource.getRepository(SearchFile);
});

beforeEach(async () => {
  await cleanRepos();
  await regularFileRepo.save(JSON.parse((await fsp.readFile("fixtures/2-regular_file.json")).toString()));
  await modelFileRepo.save(JSON.parse((await fsp.readFile("fixtures/2-model_file.json")).toString()));
  await searchFileRepo.save(JSON.parse((await fsp.readFile("fixtures/2-search_file.json")).toString()));
  await testInfoRepo.save(JSON.parse((await fsp.readFile("fixtures/0-test_info.json")).toString()));
});

afterAll(async () => {
  await cleanRepos();
  await dataSource.destroy();
});

describe("PUT /quality/:uuid", () => {
  it("fails with 400 if file does not exist", async () => {
    await expect(axios.put(`${privateUrl}4FC4577C-84BF-4557-86D8-1A1FB8D1D81E`, report)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("creates new report for model file (no prior report)", async () => {
    const uuid = "b5d1d5af-3667-41bc-b952-e684f627d91c";
    expect((await modelFileRepo.findOneByOrFail({ uuid })).errorLevel).toBe(null);
    expect((await searchFileRepo.findOneByOrFail({ uuid })).errorLevel).toBe(null);
    await putReportWithErrors(uuid);
    expect((await modelFileRepo.findOneByOrFail({ uuid })).errorLevel).toBe(ErrorLevel.ERROR);
    expect((await searchFileRepo.findOneByOrFail({ uuid })).errorLevel).toBe(ErrorLevel.ERROR);
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
  await dataSource.getRepository(Visualization).delete({});
  await dataSource.getRepository(ModelVisualization).delete({});
  await dataSource.getRepository(RegularFile).delete({});
  await dataSource.getRepository(ModelFile).delete({});
  await dataSource.getRepository(SearchFile).delete({});
}
