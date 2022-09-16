import axios from "axios";
import { promises as fsp } from "fs";

import { backendPublicUrl, str2base64 } from "../../lib";
import { Connection, createConnection, Repository } from "typeorm";
import { Download, ObjectType } from "../../../src/entity/Download";
import { ModelFile, RegularFile } from "../../../src/entity/File";
import { Collection } from "../../../src/entity/Collection";
import { InstrumentUpload } from "../../../src/entity/Upload";
import { initUsersAndPermissions } from "../../lib/userAccountAndPermissions";

let conn: Connection;
let regularFileRepo: Repository<RegularFile>;
let modelFileRepo: Repository<ModelFile>;
let collectionRepo: Repository<Collection>;
let instrumentUploadRepo: Repository<InstrumentUpload>;
let downloadRepo: Repository<Download>;

interface Params {
  dimensions: string;
  types: string;
  country?: string;
  site?: string;
}

function doRequest(params: Params, headers: any = { authorization: `Basic ${str2base64("bob:bobs_pass")}` }) {
  return axios.get(`${backendPublicUrl}download/stats`, { params, headers });
}

const getStats = async (params: Params) => (await doRequest(params)).data;

describe("GET /api/download/stats", () => {
  beforeAll(async () => {
    conn = await createConnection();
    downloadRepo = conn.getRepository("download");
    regularFileRepo = conn.getRepository("regular_file");
    modelFileRepo = conn.getRepository("model_file");
    collectionRepo = conn.getRepository("collection");
    instrumentUploadRepo = conn.getRepository("instrument_upload");
    await downloadRepo.delete({});
    await initUsersAndPermissions();
    await regularFileRepo.save(JSON.parse((await fsp.readFile("fixtures/2-regular_file.json")).toString()));
    await modelFileRepo.save(JSON.parse((await fsp.readFile("fixtures/2-model_file.json")).toString()));
    await collectionRepo.save(JSON.parse((await fsp.readFile("fixtures/3-collection.json")).toString()));
    await instrumentUploadRepo.save(JSON.parse((await fsp.readFile("fixtures/2-instrument_upload.json")).toString()));
    await downloadRepo.save([
      new Download(ObjectType.Product, "38092c00-161d-4ca2-a29d-628cf8e960f6", "1.1.1.1", "FI", new Date(2022, 0, 10)),
      new Download(ObjectType.Product, "bde7a35f-03aa-4bff-acfb-b4974ea9f217", "1.1.1.1", "FI", new Date(2022, 0, 11)),
      new Download(ObjectType.Product, "00000000-0000-0000-0000-000000000000", "1.1.1.1", "FI", new Date(2022, 0, 10)),
      new Download(ObjectType.Product, "38092c00-161d-4ca2-a29d-628cf8e960f6", "1.1.1.2", "SE", new Date(2022, 1, 10)),
      new Download(ObjectType.Product, "d21d6a9b-6804-4465-a026-74ec429fe17d", "1.1.1.1", "FI", new Date(2022, 1, 11)),
      new Download(ObjectType.Raw, "b8e96ee1-d3e1-49ba-a557-c131d56beeab", "1.1.1.3", "NO", new Date(2022, 1, 12)),
      new Download(
        ObjectType.Collection,
        "48092c00-161d-4ca2-a29d-628cf8e960f6",
        "1.1.1.3",
        "NO",
        new Date(2022, 1, 12)
      ),
    ]);
  });

  afterAll(async () => {
    await regularFileRepo.delete({});
    await modelFileRepo.delete({});
    await collectionRepo.delete({});
    await instrumentUploadRepo.delete({});
    await downloadRepo.delete({});
    await conn.close();
  });

  it("fails without authentication", () =>
    expect(doRequest({ dimensions: "yearMonth,downloads", types: "file" }, null)).rejects.toMatchObject({
      response: { status: 401 },
    }));

  it("calculates file downloads by date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", types: "file" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: 2 },
      { yearMonth: "2022-02", downloads: 2 },
    ]));

  it("calculates unique IPs by date", () =>
    expect(getStats({ dimensions: "yearMonth,uniqueIps", types: "file" })).resolves.toMatchObject([
      { yearMonth: "2022-01", uniqueIps: 1 },
      { yearMonth: "2022-02", uniqueIps: 2 },
    ]));

  it("calculates file downloads by country", () =>
    expect(getStats({ dimensions: "country,downloads", types: "file" })).resolves.toMatchObject([
      { country: "FI", downloads: 3 },
      { country: "SE", downloads: 1 },
    ]));

  it("calculates fileInCollection downloads by date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", types: "fileInCollection" })).resolves.toMatchObject([
      { yearMonth: "2022-02", downloads: 2 },
    ]));

  it("calculates rawFile downloads by date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", types: "rawFile" })).resolves.toMatchObject([
      { yearMonth: "2022-02", downloads: 1 },
    ]));

  it("sums downloads of all types", () =>
    expect(
      getStats({ dimensions: "yearMonth,downloads", types: "file,rawFile,fileInCollection" })
    ).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: 2 },
      { yearMonth: "2022-02", downloads: 5 },
    ]));

  it("sums uniqueIps of all types", () =>
    expect(
      getStats({ dimensions: "yearMonth,uniqueIps", types: "file,rawFile,fileInCollection" })
    ).resolves.toMatchObject([
      { yearMonth: "2022-01", uniqueIps: 1 },
      { yearMonth: "2022-02", uniqueIps: 3 },
    ]));

  it("sums country downloads of all types", () =>
    expect(
      getStats({ dimensions: "country,downloads", types: "file,rawFile,fileInCollection" })
    ).resolves.toMatchObject([
      { country: "FI", downloads: 3 },
      { country: "NO", downloads: 3 },
      { country: "SE", downloads: 1 },
    ]));

  it("fails to filter by both site and country", () =>
    expect(
      getStats({ dimensions: "yearMonth,downloads", types: "file", country: "FI", site: "mace-head" })
    ).rejects.toMatchObject({
      response: { status: 400 },
    }));

  it("can filter by country of files", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", types: "file", country: "FI" })).resolves.toMatchObject([
      { yearMonth: "2022-02", downloads: 1 },
    ]));

  it("can filter by site", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", types: "file", site: "hyytiala" })).resolves.toMatchObject([
      { yearMonth: "2022-02", downloads: 1 },
    ]));
});
