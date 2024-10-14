import { DataSource, Repository } from "typeorm";
import { ModelFile, RegularFile } from "../../../src/entity/File";
import { readFileSync } from "fs";
import { backendPrivateUrl, storageServiceUrl, str2base64 } from "../../lib";
import axios from "axios";
import { Visualization } from "../../../src/entity/Visualization";
import { SearchFile } from "../../../src/entity/SearchFile";
import { ModelVisualization } from "../../../src/entity/ModelVisualization";
import { FileQuality } from "../../../src/entity/FileQuality";
import { QualityReport } from "../../../src/entity/QualityReport";
import { initUsersAndPermissions } from "../../lib/userAccountAndPermissions";
const uuidGen = require("uuid");
const crypto = require("crypto");
import { readResources } from "../../../../shared/lib";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let fileRepo: Repository<RegularFile>;
let modelFileRepo: Repository<ModelFile>;
let searchFileRepo: Repository<SearchFile>;
let vizRepo: Repository<Visualization>;
let modelVizRepo: Repository<ModelVisualization>;
let fileQualityRepo: Repository<FileQuality>;
let qualityReportRepo: Repository<QualityReport>;

const volatileFile = JSON.parse(readFileSync("tests/data/file.json", "utf8"));
const stableFile = { ...volatileFile, volatile: false, pid: "1234", uuid: "487b77b0-3401-4ff0-afb0-925bb42d7ab6" };
const volatileModelFile = {
  ...volatileFile,
  model: "ecmwf",
  product: "model",
  uuid: "f47f2fb7-62c2-4884-a3c5-98421c1589cd",
};

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  fileRepo = dataSource.getRepository(RegularFile);
  modelFileRepo = dataSource.getRepository(ModelFile);
  searchFileRepo = dataSource.getRepository(SearchFile);
  vizRepo = dataSource.getRepository(Visualization);
  modelVizRepo = dataSource.getRepository(ModelVisualization);
  fileQualityRepo = dataSource.getRepository(FileQuality);
  qualityReportRepo = dataSource.getRepository(QualityReport);
  await initUsersAndPermissions();
  const prefix = `${storageServiceUrl}cloudnet-product`;
  await axios.put(`${prefix}-volatile/${volatileFile.s3key}`, "content");
  await axios.put(`${prefix}/${stableFile.s3key}`, "content");
  await axios.put(`${prefix}/legacy/${stableFile.s3key}`, "content");
});

beforeEach(async () => {
  await cleanRepos();
});

afterAll(async () => {
  await cleanRepos();
  await dataSource.destroy();
});

describe("PUT /files/:s3key", () => {
  it("inserting new volatile file", async () => {
    await expect(putFile(volatileFile)).resolves.toMatchObject({ status: 201 });
    await expect(searchFileRepo.findOneByOrFail({ uuid: volatileFile.uuid })).resolves.toBeTruthy();
    await expect(fileRepo.findOneByOrFail({ uuid: volatileFile.uuid })).resolves.toBeTruthy();
  });

  it("fails to insert new file with unknown instrument PID", async () => {
    const payload = {
      ...volatileFile,
      instrument: "mira-35",
      instrumentPid: "https://hdl.handle.net/123/granada-mirri",
    };
    await expect(putFile(payload)).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Unknown instrument PID" } },
    });
  });

  it("fails to insert new file with mismatching instrument and instrument PID", async () => {
    const payload = { ...volatileFile, instrument: "chm15k", instrumentPid: "https://hdl.handle.net/123/granada-mira" };
    await expect(putFile(payload)).rejects.toMatchObject({
      response: { status: 422, data: { status: 422, errors: "Instrument doesn't match instrument PID" } },
    });
  });

  it("updates instrument for new file", async () => {
    const payload = {
      ...volatileFile,
      instrument: "mira-35",
      instrumentPid: "https://hdl.handle.net/123/granada-mira",
    };
    await expect(putFile(payload)).resolves.toMatchObject({ status: 201 });
    const searchFile = await searchFileRepo.findOneOrFail({
      where: { uuid: volatileFile.uuid },
      relations: { instrument: true, instrumentInfo: true },
    });
    expect(searchFile.instrument).toMatchObject({ id: "mira-35" });
    expect(searchFile.instrumentInfo).toMatchObject({
      uuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
      pid: "https://hdl.handle.net/123/granada-mira",
    });
    const file = await fileRepo.findOneOrFail({
      where: { uuid: volatileFile.uuid },
      relations: { instrument: true, instrumentInfo: true },
    });
    expect(file.instrument).toMatchObject({ id: "mira-35" });
    expect(file.instrumentInfo).toMatchObject({
      uuid: "9e0f4b27-d5f3-40ad-8b73-2ae5dabbf81f",
      pid: "https://hdl.handle.net/123/granada-mira",
    });
  });

  it("updating existing volatile file", async () => {
    await expect(putFile(volatileFile)).resolves.toMatchObject({ status: 201 });
    const dbRow1 = await fileRepo.findOneByOrFail({ uuid: volatileFile.uuid });
    await expect(putFile(volatileFile)).resolves.toMatchObject({ status: 200 });
    const dbRow2 = await fileRepo.findOneByOrFail({ uuid: volatileFile.uuid });
    await expect(searchFileRepo.findOneByOrFail({ uuid: volatileFile.uuid })).resolves.toBeTruthy();
    expect(dbRow1.createdAt).toEqual(dbRow2.createdAt);
    expect(dbRow1.updatedAt < dbRow2.updatedAt);
  });

  it("fails to update volatile file with different UUID", async () => {
    const file = volatileFile;
    const replaceFile = { ...file, uuid: "b306288a-e96b-4aef-a614-6087b2416fd9" };
    await expect(putFile(file)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(replaceFile)).rejects.toMatchObject({ response: { status: 501 } });
  });

  it("inserting new version of an existing freezed file", async () => {
    await expect(putFile(stableFile)).resolves.toMatchObject({ status: 201 });
    const newVersion = {
      ...stableFile,
      ...{
        uuid: "3cf275bb-5b09-42ec-8784-943fe2a745f6",
        checksum: "510980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678",
      },
    };
    await expect(putFile(newVersion)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneByOrFail({ uuid: newVersion.uuid })).resolves.toBeTruthy();
    await expect(searchFileRepo.findOneByOrFail({ uuid: stableFile.uuid })).rejects.toBeTruthy();
    await expect(searchFileRepo.findOneByOrFail({ uuid: newVersion.uuid })).resolves.toBeTruthy();
  });

  it("inserting legacy file", async () => {
    const tmpfile = { ...volatileFile };
    tmpfile.legacy = true;
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 201 });
    await expect(fileRepo.findOneByOrFail({ uuid: volatileFile.uuid })).resolves.toMatchObject({ legacy: true });
    await expect(searchFileRepo.findOneByOrFail({ uuid: volatileFile.uuid })).resolves.toMatchObject({ legacy: true });
  });

  it("inserting a normal file and a legacy file", async () => {
    await expect(putFile(stableFile)).resolves.toMatchObject({ status: 201 });
    const tmpfile = { ...stableFile };
    tmpfile.legacy = true;
    tmpfile.uuid = "87EB042E-B247-4AC1-BC03-074DD0D74BDB";
    tmpfile.s3key = `legacy/${stableFile.s3key}`;
    tmpfile.checksum = "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 200 });
    await expect(searchFileRepo.findOneByOrFail({ uuid: stableFile.uuid })).resolves.toMatchObject({ legacy: false });
    await expect(searchFileRepo.findOneByOrFail({ uuid: tmpfile.uuid })).rejects.toBeTruthy();
  });

  it("inserting a legacy file and a normal file", async () => {
    const tmpfile = { ...stableFile };
    tmpfile.legacy = true;
    tmpfile.uuid = "87EB042E-B247-4AC1-BC03-074DD0D74BDB";
    tmpfile.s3key = `legacy/${stableFile.s3key}`;
    tmpfile.checksum = "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(stableFile)).resolves.toMatchObject({ status: 200 });
    await expect(searchFileRepo.findOneByOrFail({ uuid: stableFile.uuid })).resolves.toMatchObject({ legacy: false });
    await expect(searchFileRepo.findOneByOrFail({ uuid: tmpfile.uuid })).rejects.toBeTruthy();
  });

  it("inserting a legacy file and two normal files", async () => {
    const tmpfile = { ...stableFile };
    tmpfile.legacy = true;
    tmpfile.uuid = "87EB042E-B247-4AC1-BC03-074DD0D74BDB";
    tmpfile.s3key = `legacy/${stableFile.s3key}`;
    tmpfile.checksum = "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    const tmpfile2 = { ...stableFile };
    tmpfile2.uuid = "97EB042E-B247-4AC1-BC03-074DD0D74BDB";
    tmpfile2.checksum = "010980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(stableFile)).resolves.toMatchObject({ status: 200 });
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 200 });
    await expect(searchFileRepo.findOneByOrFail({ uuid: stableFile.uuid })).rejects.toBeTruthy();
    await expect(searchFileRepo.findOneByOrFail({ uuid: tmpfile.uuid })).rejects.toBeTruthy();
    await expect(searchFileRepo.findOneByOrFail({ uuid: tmpfile2.uuid })).resolves.toMatchObject({ legacy: false });
  });

  it("inserting two model files (first worse, then better)", async () => {
    const tmpfile1 = { ...volatileFile, product: "model", model: "icon-iglo-12-23" };
    const tmpfile2 = {
      ...tmpfile1,
      model: "ecmwf",
      uuid: "87EB042E-B247-4AC1-BC03-074DD0D74BDB",
      s3key: "20181115_mace-head_ecmwf.nc",
      checksum: "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678",
    };
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile1.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile1.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, "content");
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile2.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile2.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeTruthy();
  });

  it("inserting two model files (first better, then worse)", async () => {
    const tmpfile1 = { ...volatileFile, product: "model", model: "ecmwf" };
    const tmpfile2 = {
      ...tmpfile1,
      model: "icon-iglo-24-35",
      uuid: "87EB042E-B247-4AC1-BC03-074DD0D74BDB",
      s3key: "20181115_mace-head_icon-iglo-24-35.nc",
      checksum: "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678",
    };
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, "content");
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 201 });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
  });

  it("inserting several model files with different optimumOrder", async () => {
    const tmpfile1 = { ...volatileFile, product: "model", model: "icon-iglo-24-35" };
    const tmpfile2 = {
      ...tmpfile1,
      model: "icon-iglo-36-47",
      uuid: "87EB042E-B247-4AC1-BC03-074DD0D74BDB",
      s3key: "20181115_mace-head_icon-iglo-36-47.nc",
      checksum: "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678",
    };
    const tmpfile3 = {
      ...tmpfile1,
      model: "ecmwf",
      uuid: "abde0a2a-40e7-4463-9266-06f50153d974",
      s3key: "20181115_mace-head_ecmwf.nc",
      checksum: "deb5a92691553bcac4cfb57f5917d7cbf9ccfae9592c40626d9615bd64ebeffe",
    };
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile1.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile1.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, "content");
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile2.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile2.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeTruthy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile3.s3key}`, "content");
    await expect(putFile(tmpfile3)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile3.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile3.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile3.uuid })).resolves.toBeTruthy();
  });

  it("inserting several model files with different optimumOrder II", async () => {
    const tmpfile1 = { ...volatileFile, product: "model", model: "ecmwf" };
    const tmpfile2 = {
      ...volatileFile,
      product: "model",
      model: "gdas1",
      uuid: "abde0a2a-40e7-4463-9266-06f50153d974",
      s3key: "20181115_mace-head_gdas1.nc",
      checksum: "deb5a92691553bcac4cfb57f5917d7cbf9ccfae9592c40626d9615bd64ebeffe",
    };
    const tmpfile3 = {
      ...tmpfile1,
      model: "icon-iglo-36-47",
      uuid: "87EB042E-B247-4AC1-BC03-074DD0D74BDB",
      s3key: "20181115_mace-head_icon-iglo-36-47.nc",
      checksum: "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678",
    };
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile1.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile1.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, "content");
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile2.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile2.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile3.s3key}`, "content");
    await expect(putFile(tmpfile3)).resolves.toMatchObject({ status: 201 });
    await expect(
      modelFileRepo.findOneOrFail({ where: { uuid: tmpfile3.uuid }, relations: { model: true } }),
    ).resolves.toMatchObject({
      model: { id: tmpfile3.model },
    });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile3.uuid })).resolves.toBeFalsy();
  });

  it("inserting several model files with different optimumOrder III", async () => {
    const tmpfile1 = { ...volatileFile, product: "model", model: "icon-iglo-24-35" };
    const tmpfile2 = {
      ...tmpfile1,
      model: "icon-iglo-36-47",
      uuid: "abde0a2a-40e7-4463-9266-06f50153d974",
      s3key: "20181115_mace-head_icon-iglo-36.nc",
      checksum: "deb5a92691553bcac4cfb57f5917d7cbf9ccfae9592c40626d9615bd64ebeffe",
    };
    const tmpfile3 = {
      ...tmpfile1,
      model: "ecmwf",
      uuid: "abde0a2a-40e7-4463-9266-06f50153d972",
      s3key: "20181115_mace-head_ecmwf.nc",
      checksum: "a3d5a47545c4cf41cca176799da13930389925dc5d04ee62a83a494ee0f04c57",
    };
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile1.s3key}`, "content");
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeTruthy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile3.uuid })).resolves.toBeFalsy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, "content");
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 200 });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeTruthy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile3.uuid })).resolves.toBeFalsy();
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile3.s3key}`, "content");
    await expect(putFile(tmpfile3)).resolves.toMatchObject({ status: 201 });
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile1.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile2.uuid })).resolves.toBeFalsy();
    await expect(searchFileRepo.findOneBy({ uuid: tmpfile3.uuid })).resolves.toBeTruthy();
  });

  it("errors on invalid site", async () => {
    const tmpfile = { ...stableFile };
    tmpfile.site = "bökärest";
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("overwrites existing freezed files on test site", async () => {
    const tmpfile = { ...stableFile };
    tmpfile.site = "granada";
    tmpfile.s3key = "20181115_granada_mira.nc";
    await axios.put(`${storageServiceUrl}cloudnet-product/${tmpfile.s3key}`, "content");
    await putFile(tmpfile);
    const dbRow1 = await fileRepo.findOneByOrFail({ uuid: stableFile.uuid });
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 200 });
    const dbRow2 = await fileRepo.findOneByOrFail({ uuid: stableFile.uuid });
    expect(dbRow1.updatedAt < dbRow2.updatedAt);
  });

  it("inserts new file with source files", async () => {
    await putFile(stableFile);
    await putFile(volatileModelFile);
    const tmpfile = { ...stableFile };
    tmpfile.sourceFileIds = [stableFile.uuid, volatileModelFile.uuid];
    tmpfile.uuid = "62b32746-faf0-4057-9076-ed2e698dcc34";
    tmpfile.checksum = "dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5";
    tmpfile.s3key = "20181115_mace-head_hatpro.nc";
    tmpfile.product = "categorize";
    await axios.put(`${storageServiceUrl}cloudnet-product/${tmpfile.s3key}`, "content");
    await expect(putFile(tmpfile)).resolves.toMatchObject({ status: 201 });
    const dbRow1 = await fileRepo.findOneOrFail({
      where: { uuid: tmpfile.uuid },
      relations: { sourceRegularFiles: true, sourceModelFiles: true },
    });
    expect(dbRow1.sourceRegularFiles).toHaveLength(1);
    expect(dbRow1.sourceRegularFiles[0].uuid).toBe(stableFile.uuid);
    expect(dbRow1.sourceModelFiles).toHaveLength(1);
    expect(dbRow1.sourceModelFiles[0].uuid).toBe(volatileModelFile.uuid);
  });

  it("errors on nonexisting source files", async () => {
    await putFile(stableFile);
    const tmpfile = { ...stableFile };
    tmpfile.sourceFileIds = ["42b32746-faf0-4057-9076-ed2e698dcc34"];
    tmpfile.uuid = "22b32746-faf0-4057-9076-ed2e698dcc34";
    tmpfile.checksum = "dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5";
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("errors on model versions", async () => {
    const tmpfile1 = { ...stableFile };
    tmpfile1.product = "model";
    tmpfile1.model = "ecmwf";
    const tmpfile2 = { ...tmpfile1 };
    tmpfile2.uuid = "87EB042E-B247-4AC1-BC03-074DD0D74BDB";
    tmpfile2.checksum = "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(tmpfile2)).rejects.toMatchObject({ response: { status: 501 } });
  });

  it("replaces on freezed model file", async () => {
    const tmpfile1 = { ...stableFile };
    tmpfile1.product = "model";
    tmpfile1.model = "ecmwf";
    const tmpfile2 = { ...tmpfile1 };
    tmpfile2.checksum = "610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678";
    await expect(putFile(tmpfile1)).resolves.toMatchObject({ status: 201 });
    await expect(putFile(tmpfile2)).resolves.toMatchObject({ status: 200 });
  });

  it("errors on invalid filename", async () => {
    // filename: 20181115_mace-head_mira.nc
    let tmpfile = { ...volatileFile };
    tmpfile.measurementDate = "2018-11-16";
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: { status: 400 } });
    tmpfile = { ...volatileFile };
    tmpfile.site = "hyytiala";
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("inserts and updates software", async () => {
    await expect(putFile(volatileFile)).resolves.toMatchObject({ status: 201 });
    const file1 = await fileRepo.findOneOrFail({ where: { uuid: volatileFile.uuid }, relations: { software: true } });
    expect(file1.software.length).toBe(1);
    expect(file1.software[0].code).toBe("cloudnetpy");
    expect(file1.software[0].version).toBe("1.0.4");

    await expect(putFile({ ...volatileFile, software: { cloudnetpy: "1.0.5" } })).resolves.toMatchObject({
      status: 200,
    });
    const file2 = await fileRepo.findOneOrFail({ where: { uuid: volatileFile.uuid }, relations: { software: true } });
    expect(file2.software.length).toBe(1);
    expect(file2.software[0].code).toBe("cloudnetpy");
    expect(file2.software[0].version).toBe("1.0.5");
  });
});

describe("POST /files/", () => {
  it("refuse freezing a file without pid", async () => {
    const tmpfile = { ...stableFile };
    delete tmpfile.pid;
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("freezing existing file", async () => {
    await putFile(volatileFile);
    const payload = {
      uuid: volatileFile.uuid,
      volatile: false,
      pid: "1234",
      checksum: "dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5",
    };
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({ status: 200 });
    const dbRow = await fileRepo.findOneByOrFail({ uuid: volatileFile.uuid });
    const dbRow2 = await searchFileRepo.findOneByOrFail({ uuid: volatileFile.uuid });
    expect(dbRow.volatile).toEqual(false);
    expect(dbRow.pid).toEqual(payload.pid);
    expect(dbRow.checksum).toEqual(payload.checksum);
    expect(dbRow2.volatile).toEqual(false);
  });

  it("freezing existing model file", async () => {
    await putFile(volatileModelFile);
    const payload = {
      uuid: volatileModelFile.uuid,
      volatile: false,
      pid: "1234",
      checksum: "dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5",
    };
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({ status: 200 });
    const dbRow = await modelFileRepo.findOneByOrFail({ uuid: volatileModelFile.uuid });
    const dbRow2 = await searchFileRepo.findOneByOrFail({ uuid: volatileModelFile.uuid });
    expect(dbRow.volatile).toEqual(false);
    expect(dbRow.pid).toEqual(payload.pid);
    expect(dbRow.checksum).toEqual(payload.checksum);
    expect(dbRow2.volatile).toEqual(false);
  });

  it("refuse updating freezed file", async () => {
    await putFile(stableFile);
    await expect(putFile(stableFile)).rejects.toMatchObject({
      response: {
        status: 403,
        data: { errors: ["File exists and cannot be updated since it is freezed and not from a test site"] },
      },
    });
  });

  it("updating version id does not update updatedAt", async () => {
    await putFile(stableFile);
    const dbRow1 = await fileRepo.findOneByOrFail({ uuid: stableFile.uuid });
    const payload = { uuid: stableFile.uuid, version: "999" };
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({ status: 200 });
    const dbRow2 = await fileRepo.findOneByOrFail({ uuid: stableFile.uuid });
    expect(dbRow2.version).toEqual("999");
    expect(dbRow2.updatedAt).toEqual(dbRow1.updatedAt);
  });
});

describe("DELETE /api/files/", () => {
  const privUrl = `${backendPrivateUrl}visualizations/`;

  it("missing mandatory parameter", async () => {
    const file = await putDummyFile({ product: "radar", volatile: false });
    await expect(deleteFile(file.uuid)).rejects.toMatchObject({ response: { status: 404 } });
    await expect(deleteFile(file.uuid, true)).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("incorrect parameter value", async () => {
    const file = await putDummyFile({ product: "radar", volatile: false });
    await expect(deleteFile(file.uuid, "kissa", false)).rejects.toMatchObject({ response: { status: 400 } });
    await expect(deleteFile(file.uuid, "treu", false)).rejects.toMatchObject({ response: { status: 400 } });
    await expect(deleteFile(file.uuid, "fales", false)).rejects.toMatchObject({ response: { status: 400 } });
    await expect(deleteFile(file.uuid, true, "kissa")).rejects.toMatchObject({ response: { status: 400 } });
    await expect(deleteFile(file.uuid, false, "treu")).rejects.toMatchObject({ response: { status: 400 } });
    await expect(deleteFile(file.uuid, false, "fales")).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("refuses deleting a stable file", async () => {
    const radarFile = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/stable-pid",
    });
    await expect(deleteFile(radarFile.uuid, false, false)).rejects.toMatchObject({ response: { status: 422 } });
    await fileRepo.findOneByOrFail({ uuid: radarFile.uuid });
  });

  it("refuses deleting non-existent file", async () => {
    const uuid = "db9156e5-8b97-4e9f-8974-55757d873e5e";
    await expect(deleteFile(uuid, false, false)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("deletes regular volatile file and images", async () => {
    const radarFile = await putDummyFile();
    await putDummyImage("radar-v.png", radarFile);
    await putDummyImage("radar-ldr.png", radarFile);
    await expect(deleteFile(radarFile.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile.uuid })).resolves.toBeFalsy();
    await expect(vizRepo.findOneBy({ s3key: "radar-v.png" })).resolves.toBeFalsy();
    await expect(vizRepo.findOneBy({ s3key: "radar-ldr.png" })).resolves.toBeFalsy();
  });

  it("deletes model file and images", async () => {
    const modelFile = await putDummyFile({ product: "model" });
    await putDummyImage("model-temperature.png", modelFile);
    await expect(deleteFile(modelFile.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(modelFileRepo.findOneBy({ uuid: modelFile.uuid })).resolves.toBeFalsy();
    await expect(modelVizRepo.findOneBy({ s3key: "model-temperature.png" })).resolves.toBeFalsy();
  });

  it("deletes images", async () => {
    const radarFile = await putDummyFile();
    await putDummyImage("radar-v.png", radarFile);
    await putDummyImage("radar-ldr.png", radarFile);
    const headers = { authorization: `Basic ${str2base64("bob:bobs_pass")}` };
    const url = `${backendPrivateUrl}api/visualizations/${radarFile.uuid}`;
    const params: any = { images: ["radar-v", "radar-ldr"] };
    await axios.delete(url, { params: params, headers: headers });
    await expect(vizRepo.findOneBy({ s3key: "radar-v.png" })).resolves.toBeFalsy();
    await expect(vizRepo.findOneBy({ s3key: "radar-ldr.png" })).resolves.toBeFalsy();
  });

  it("deletes higher-level volatile products too", async () => {
    const radarFile = await putDummyFile();
    await putDummyImage("radar-v.png", radarFile);
    const categorizeFile = await putDummyFile({ product: "categorize", sourceFileIds: [radarFile.uuid] });
    await putDummyImage("categorize-ldr.png", categorizeFile);
    await expect(deleteFile(radarFile.uuid, true, false)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile.uuid })).resolves.toBeFalsy();
    await expect(fileRepo.findOneBy({ uuid: categorizeFile.uuid })).resolves.toBeFalsy();
    await expect(vizRepo.findOneBy({ s3key: "radar-v.png" })).resolves.toBeFalsy();
    await expect(vizRepo.findOneBy({ s3key: "categorize-ldr.png" })).resolves.toBeFalsy();
  });

  it("does not delete with dryRun parameter", async () => {
    const radarFile = await putDummyFile();
    await putDummyImage("radar-v.png", radarFile);
    const categorizeFile = await putDummyFile({ product: "categorize", sourceFileIds: [radarFile.uuid] });
    await putDummyImage("categorize-ldr.png", categorizeFile);
    await expect(deleteFile(radarFile.uuid, true, true)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile.uuid })).resolves.toBeTruthy();
    await expect(fileRepo.findOneBy({ uuid: categorizeFile.uuid })).resolves.toBeTruthy();
    await expect(vizRepo.findOneBy({ s3key: "radar-v.png" })).resolves.toBeTruthy();
    await expect(vizRepo.findOneBy({ s3key: "categorize-ldr.png" })).resolves.toBeTruthy();
  });

  it("returns list of deleted products", async () => {
    const radarFile = await putDummyFile();
    await putDummyImage("radar-v.png", radarFile);
    const categorizeFile = await putDummyFile({ product: "categorize", sourceFileIds: [radarFile.uuid] });
    await putDummyImage("categorize-ldr.png", categorizeFile);
    const res = await deleteFile(radarFile.uuid, true, true);
    expect(res.data).toHaveLength(2);
    expect(res.data.map((file: any) => file.product.id).sort()).toEqual(["categorize", "radar"].sort());
  });

  it("refuses deleting if derived product is stable", async () => {
    const file = await putDummyFile();
    await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [file.uuid],
      pid: "https://hdl.handle.net/123/stable-pid",
    });
    await expect(deleteFile(file.uuid, true, false)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("refuses deleting if any of derived products is stable", async () => {
    const radarFile = await putDummyFile();
    const categorizeFile = await putDummyFile({
      product: "categorize",
      sourceFileIds: [radarFile.uuid],
      pid: "https://hdl.handle.net/123/stable-pid",
    });
    await putDummyFile({ product: "classification", volatile: false, sourceFileIds: [categorizeFile.uuid] });
    await expect(deleteFile(radarFile.uuid, true, false)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("deleting using deleteHigherProducts parameter I", async () => {
    const radarFile = await putDummyFile();
    const categorizeFile = await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [radarFile.uuid],
    });
    await expect(deleteFile(radarFile.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile.uuid })).resolves.toBeFalsy();
    await expect(fileRepo.findOneBy({ uuid: categorizeFile.uuid })).resolves.toBeTruthy();
  });

  it("deleting using deleteHigherProducts parameter II", async () => {
    const radarFile = await putDummyFile();
    const categorizeFile = await putDummyFile({ product: "categorize", sourceFileIds: [radarFile.uuid] });
    await expect(deleteFile(radarFile.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile.uuid })).resolves.toBeFalsy();
    await expect(fileRepo.findOneBy({ uuid: categorizeFile.uuid })).resolves.toBeTruthy();
  });

  it("deletes model file", async () => {
    const file = await putDummyFile({ product: "model" });
    await expect(deleteFile(file.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(modelFileRepo.findOneBy({ uuid: file.uuid })).resolves.toBeFalsy();
  });

  it("deletes model file and derived products", async () => {
    const modelFile = await putDummyFile({ product: "model" });
    const categorizeFile = await putDummyFile({ product: "categorize", sourceFileIds: [modelFile.uuid] });
    await expect(deleteFile(modelFile.uuid, true, false)).resolves.toMatchObject({ status: 200 });
    await expect(modelFileRepo.findOneBy({ uuid: modelFile.uuid })).resolves.toBeFalsy();
    await expect(fileRepo.findOneBy({ uuid: categorizeFile.uuid })).resolves.toBeFalsy();
  });

  it("refuses deleting model file if higher-level products contain stable product", async () => {
    const modelFile = await putDummyFile({ product: "model" });
    await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [modelFile.uuid],
      pid: "https://hdl.handle.net/123/stable-pid",
    });
    await expect(deleteFile(modelFile.uuid, true, false)).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("deletes quality reports too", async () => {
    const resources = await readResources();
    const report = resources["quality-report-pass"];
    const file = await putDummyFile({ product: "model" });
    const url = `${backendPrivateUrl}quality/`;
    await expect(axios.put(`${url}${file.uuid}`, report)).resolves.toMatchObject({
      status: 201,
    });
    await expect(fileQualityRepo.findOneBy({ uuid: file.uuid })).resolves.toBeTruthy();
    let reports = await qualityReportRepo.findBy({ qualityUuid: file.uuid });
    expect(reports.length).toEqual(5);
    await expect(deleteFile(file.uuid, false, false)).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: file.uuid })).resolves.toBeFalsy();
    await expect(fileQualityRepo.findOneBy({ uuid: file.uuid })).resolves.toBeFalsy();
    reports = await qualityReportRepo.findBy({ qualityUuid: file.uuid });
    expect(reports).toMatchObject([]);
  });

  it("patches file with tombstone and removes from search file", async () => {
    const radarFile = await putDummyFile({ volatile: false, pid: "https://hdl.handle.net/123/stable-pid" });
    await expect(deleteFile(radarFile.uuid, false, false, "Kaljaa")).resolves.toMatchObject({ status: 200 });
    const file = await fileRepo.findOneByOrFail({ uuid: radarFile.uuid });
    expect(file.tombstoneReason).toEqual("Kaljaa");
    expect(await searchFileRepo.existsBy({ uuid: radarFile.uuid })).toBeFalsy();
  });

  it("removes volatile file and tombstones stable file", async () => {
    const modelFile = await putDummyFile({ product: "model" });
    const categorizeFile = await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [modelFile.uuid],
      pid: "https://hdl.handle.net/123/stable-pid",
    });
    await expect(deleteFile(modelFile.uuid, true, false, "Viinaa")).resolves.toMatchObject({ status: 200 });

    const file = await fileRepo.findOneByOrFail({ uuid: categorizeFile.uuid });
    expect(file.tombstoneReason).toEqual("Viinaa");
    expect(await searchFileRepo.existsBy({ uuid: categorizeFile.uuid })).toBeFalsy();

    expect(await modelFileRepo.existsBy({ uuid: modelFile.uuid })).toBeFalsy();
    expect(await searchFileRepo.existsBy({ uuid: modelFile.uuid })).toBeFalsy();
  });

  it("returns to latest version if older file is tombstoned", async () => {
    const radarFile1 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid1",
    });
    const radarFile2 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid2",
      version: true,
    });
    await expect(fileRepo.findOneBy({ uuid: radarFile1.uuid })).resolves.toBeTruthy();
    await expect(fileRepo.findOneBy({ uuid: radarFile2.uuid })).resolves.toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile1.uuid })).toBeFalsy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeTruthy();
    await expect(deleteFile(radarFile2.uuid, false, false, "Blah")).resolves.toMatchObject({ status: 200 });
    await expect(fileRepo.findOneBy({ uuid: radarFile1.uuid })).resolves.toBeTruthy();
    await expect(fileRepo.findOneBy({ uuid: radarFile2.uuid })).resolves.toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile1.uuid })).toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeFalsy();
  });

  it("keeps the latest version if older file is tombstoned", async () => {
    const radarFile1 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid1",
    });
    const radarFile2 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid2",
      version: true,
    });
    await expect(deleteFile(radarFile1.uuid, false, false, "Blah")).resolves.toMatchObject({ status: 200 });
    expect(await searchFileRepo.existsBy({ uuid: radarFile1.uuid })).toBeFalsy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeTruthy();
  });

  it("adds latest good version to search file if newest file is tombstoned", async () => {
    const radarFile1 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid1",
    });
    const radarFile2 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid2",
      version: true,
    });
    const radarFile3 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid3",
      version: true,
    });
    await expect(deleteFile(radarFile2.uuid, false, false, "Blah")).resolves.toMatchObject({ status: 200 });
    await expect(deleteFile(radarFile3.uuid, false, false, "Blah")).resolves.toMatchObject({ status: 200 });
    expect(await searchFileRepo.existsBy({ uuid: radarFile1.uuid })).toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeFalsy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile3.uuid })).toBeFalsy();
  });

  it("adds latest good version to search file if newest file is tombstoned and updates derived products too", async () => {
    const radarFile1 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid1",
    });
    const radarFile2 = await putDummyFile({
      product: "radar",
      volatile: false,
      pid: "https://hdl.handle.net/123/pid2",
      version: true,
    });
    const catFile1 = await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [radarFile1.uuid],
      pid: "https://hdl.handle.net/123/pid3",
    });
    const catFile2 = await putDummyFile({
      product: "categorize",
      volatile: false,
      sourceFileIds: [radarFile2.uuid],
      pid: "https://hdl.handle.net/123/pid4",
      version: true,
    });

    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: catFile2.uuid })).toBeTruthy();
    await expect(deleteFile(radarFile2.uuid, true, false, "Blah")).resolves.toMatchObject({ status: 200 });
    expect(await searchFileRepo.existsBy({ uuid: radarFile1.uuid })).toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: catFile1.uuid })).toBeTruthy();
    expect(await searchFileRepo.existsBy({ uuid: radarFile2.uuid })).toBeFalsy();
    expect(await searchFileRepo.existsBy({ uuid: catFile2.uuid })).toBeFalsy();
  });

  it("rejects bad tombstone payload", async () => {
    const radarFile = await putDummyFile();
    const badPayloads = [" ", ""];
    for (const badPayload of badPayloads) {
      await expect(deleteFile(radarFile.uuid, false, false, badPayload)).rejects.toMatchObject({
        response: { status: 400 },
      });
      expect(await searchFileRepo.existsBy({ uuid: radarFile.uuid })).toBeTruthy();
    }
  });

  async function putDummyFile(
    options: Partial<{
      product: string;
      volatile: boolean;
      sourceFileIds: string[];
      pid: string;
      version: boolean;
    }> = {},
  ) {
    const statusCode = options.version ? 200 : 201;
    const { product = "radar", volatile = true, pid = null } = options;
    const file = {
      ...volatileFile,
      ...options,
      ...{ uuid: uuidGen.v4(), product, volatile },
      s3key: `20181115_mace-head_${product}.nc`,
      checksum: generateHash(),
    };
    if (pid) file.pid = pid;
    if (product === "model" && !file.model) file.model = "ecmwf";
    const bucketFix = volatile ? "-volatile" : "";
    await axios.put(`${storageServiceUrl}cloudnet-product${bucketFix}/${file.s3key}`, "content");
    await expect(putFile(file)).resolves.toMatchObject({ status: statusCode });
    return file;
  }

  async function putDummyImage(id: string, file: any) {
    const payload = {
      sourceFileId: file.uuid,
      variableId: id.replace(/\.[^/.]+$/, ""),
    };
    await axios.put(`${storageServiceUrl}cloudnet-img/${id}`, "content");
    await axios.put(`${privUrl}${id}`, payload);
    const repo = file.product === "model" ? modelVizRepo : vizRepo;
    await expect(repo.findOneByOrFail({ s3key: id })).resolves.toBeTruthy();
  }
});

async function putFile(json: any) {
  const url = `${backendPrivateUrl}files/${json.s3key}`;
  return await axios.put(url, json);
}

async function deleteFile(
  uuid: string,
  deleteHigherProducts: any = null,
  dryRun: any = null,
  tombstoneReason: any = null,
) {
  const headers = { authorization: `Basic ${str2base64("bob:bobs_pass")}` };
  const url = `${backendPrivateUrl}api/files/${uuid}`;
  const params: any = {};
  if (deleteHigherProducts !== null) {
    params["deleteHigherProducts"] = deleteHigherProducts;
  }
  if (dryRun !== null) {
    params["dryRun"] = dryRun;
  }
  if (tombstoneReason !== null) {
    params["tombstoneReason"] = tombstoneReason;
  }
  return await axios.delete(url, { params: params, headers: headers });
}

function generateHash() {
  return crypto.randomBytes(20).toString("hex");
}

async function cleanRepos() {
  await vizRepo.delete({});
  await modelVizRepo.delete({});
  await modelFileRepo.delete({});
  await fileRepo.delete({});
  await searchFileRepo.delete({});
  await fileQualityRepo.delete({});
  await qualityReportRepo.delete({});
}
