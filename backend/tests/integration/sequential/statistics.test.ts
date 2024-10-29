import axios from "axios";
import { promises as fsp } from "fs";

import { backendPublicUrl, str2base64 } from "../../lib";
import { DataSource, Repository } from "typeorm";
import { Download, ObjectType } from "../../../src/entity/Download";
import { ModelFile, RegularFile } from "../../../src/entity/File";
import { Collection } from "../../../src/entity/Collection";
import { InstrumentUpload } from "../../../src/entity/Upload";
import { initUsersAndPermissions } from "../../lib/userAccountAndPermissions";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { SearchFile } from "../../../src/entity/SearchFile";

let dataSource: DataSource;
let regularFileRepo: Repository<RegularFile>;
let modelFileRepo: Repository<ModelFile>;
let searchFileRepo: Repository<SearchFile>;
let collectionRepo: Repository<Collection>;
let instrumentUploadRepo: Repository<InstrumentUpload>;
let downloadRepo: Repository<Download>;

interface Params {
  dimensions: string;
  country?: string;
  site?: string;
  dvasFacility?: string;
  productTypes?: string;
  downloadDateFrom?: string;
  downloadDateTo?: string;
}

function doRequest(params: Params, headers: any = { authorization: `Basic ${str2base64("bob:bobs_pass")}` }) {
  return axios.get(`${backendPublicUrl}statistics`, { params, headers });
}

const getStats = async (params: Params) => (await doRequest(params)).data;

describe("GET /api/statistics", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    downloadRepo = dataSource.getRepository(Download);
    regularFileRepo = dataSource.getRepository(RegularFile);
    modelFileRepo = dataSource.getRepository(ModelFile);
    searchFileRepo = dataSource.getRepository(SearchFile);
    collectionRepo = dataSource.getRepository(Collection);
    instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
    await downloadRepo.delete({});
    await initUsersAndPermissions();
    await modelFileRepo.save(JSON.parse((await fsp.readFile("fixtures/5-model_file.json")).toString()));
    await regularFileRepo.save(JSON.parse((await fsp.readFile("fixtures/5-regular_file.json")).toString()));
    await searchFileRepo.save(JSON.parse((await fsp.readFile("fixtures/5-search_file.json")).toString()));
    await collectionRepo.save(JSON.parse((await fsp.readFile("fixtures/6-collection.json")).toString()));
    // Download half year of Mace Head data with two variables ≈ 1 variable year.
    await downloadRepo.save(
      Array.from(
        { length: 181 },
        (_, day) =>
          new Download(
            ObjectType.Product,
            "38092c00-161d-4ca2-a29d-628cf8e960f6",
            "1.1.1.1",
            "FI",
            new Date(2022, 0, day + 1),
          ),
      ),
    );
    // Download half year of Hyytiälä data with two variables ≈ 1 variable year.
    await downloadRepo.save(
      Array.from(
        { length: 181 },
        (_, day) =>
          new Download(
            ObjectType.Product,
            "d21d6a9b-6804-4465-a026-74ec429fe17d",
            "1.1.1.2",
            "NO",
            new Date(2022, 0, day + 1),
          ),
      ),
    );
    // Download half year of collection with one observation and model files with three variables ≈ 1.5 variable year.
    await downloadRepo.save(
      Array.from(
        { length: 184 },
        (_, day) =>
          new Download(
            ObjectType.Collection,
            "48092c00-161d-4ca2-a29d-628cf8e960f6",
            "1.1.1.3",
            "SE",
            new Date(2022, 0, 182 + day),
          ),
      ),
    );
    await dataSource.query("REFRESH MATERIALIZED VIEW download_stats");
  });

  afterAll(async () => {
    await regularFileRepo.delete({});
    await modelFileRepo.delete({});
    await searchFileRepo.delete({});
    await collectionRepo.delete({});
    await instrumentUploadRepo.delete({});
    await downloadRepo.delete({});
    await dataSource.destroy();
  });

  it("fails without authentication", () =>
    expect(doRequest({ dimensions: "yearMonth,downloads" }, null)).rejects.toMatchObject({
      response: { status: 401 },
    }));

  it("calculates file downloads by date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 2 * 28) / 300, 10) },
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo(((2 + 1) * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo(((2 + 1) * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
    ]));

  it("calculates unique IPs by month year", () =>
    expect(getStats({ dimensions: "yearMonth,uniqueIps" })).resolves.toMatchObject([
      { yearMonth: "2022-01", uniqueIps: 2 },
      { yearMonth: "2022-02", uniqueIps: 2 },
      { yearMonth: "2022-03", uniqueIps: 2 },
      { yearMonth: "2022-04", uniqueIps: 2 },
      { yearMonth: "2022-05", uniqueIps: 2 },
      { yearMonth: "2022-06", uniqueIps: 2 },
      { yearMonth: "2022-07", uniqueIps: 1 },
      { yearMonth: "2022-08", uniqueIps: 1 },
      { yearMonth: "2022-09", uniqueIps: 1 },
      { yearMonth: "2022-10", uniqueIps: 1 },
      { yearMonth: "2022-11", uniqueIps: 1 },
      { yearMonth: "2022-12", uniqueIps: 1 },
    ]));

  it("calculates unique IPs by year", () =>
    expect(getStats({ dimensions: "year,uniqueIps" })).resolves.toMatchObject([{ year: "2022", uniqueIps: 3 }]));

  it("calculates file downloads by country", () =>
    expect(getStats({ dimensions: "country,downloads" })).resolves.toMatchObject([
      { country: "FI", downloads: expect.closeTo((2 * 181) / 300, 10) },
      { country: "NO", downloads: expect.closeTo((2 * 181) / 300, 10) },
      { country: "SE", downloads: expect.closeTo(((1 + 2) * 184) / 300, 10) },
    ]));

  it("fails to filter by both site and country", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", country: "FI", site: "mace-head" })).rejects.toMatchObject({
      response: { status: 400 },
    }));

  it("can filter by country of files", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", country: "FI" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 28) / 300, 10) },
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo((2 * 31) / 300, 10) },
    ]));

  it("can filter by site", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", site: "mace-head" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 28) / 300, 10) },
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo((1 * 31) / 300, 10) },
    ]));

  it("can filter by DVAS facility", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", dvasFacility: "mchd" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 28) / 300, 10) },
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo((1 * 31) / 300, 10) },
    ]));

  it("fails to filter by invalid products", () =>
    expect(
      getStats({ dimensions: "yearMonth,downloads", country: "FI", site: "mace-head", productTypes: "invalid" }),
    ).rejects.toMatchObject({
      response: { status: 400 },
    }));

  it("calculates file downloads of observation products", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", productTypes: "observation" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 2 * 28) / 300, 10) },
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo((2 * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo((2 * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo((2 * 31) / 300, 10) },
    ]));

  it("calculates file downloads of model products", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", productTypes: "model" })).resolves.toMatchObject([
      { yearMonth: "2022-07", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo((1 * 31) / 300, 10) },
      { yearMonth: "2022-11", downloads: expect.closeTo((1 * 30) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo((1 * 31) / 300, 10) },
    ]));

  it("filters until download date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", downloadDateTo: "2022-02-20" })).resolves.toMatchObject([
      { yearMonth: "2022-01", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-02", downloads: expect.closeTo((2 * 2 * 20) / 300, 10) },
    ]));

  it("filters from download date", () =>
    expect(getStats({ dimensions: "yearMonth,downloads", downloadDateFrom: "2022-11-21" })).resolves.toMatchObject([
      { yearMonth: "2022-11", downloads: expect.closeTo(((2 + 1) * 10) / 300, 10) },
      { yearMonth: "2022-12", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
    ]));

  it("filters between download dates", () =>
    expect(
      getStats({ dimensions: "yearMonth,downloads", downloadDateFrom: "2022-03-02", downloadDateTo: "2022-10-15" }),
    ).resolves.toMatchObject([
      { yearMonth: "2022-03", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-04", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-05", downloads: expect.closeTo((2 * 2 * 31) / 300, 10) },
      { yearMonth: "2022-06", downloads: expect.closeTo((2 * 2 * 30) / 300, 10) },
      { yearMonth: "2022-07", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
      { yearMonth: "2022-08", downloads: expect.closeTo(((2 + 1) * 31) / 300, 10) },
      { yearMonth: "2022-09", downloads: expect.closeTo(((2 + 1) * 30) / 300, 10) },
      { yearMonth: "2022-10", downloads: expect.closeTo(((2 + 1) * 15) / 300, 10) },
    ]));

  it("returns monthly curated total data", () =>
    expect(getStats({ dimensions: "yearMonth,curatedData", productTypes: "observation,model" })).resolves.toMatchObject(
      [
        { yearMonth: "2014-12", curatedData: expect.closeTo(1 / 300, 10) }, // model
        { yearMonth: "2018-11", curatedData: expect.closeTo(2 / 300, 10) }, // radar
        { yearMonth: "2019-09", curatedData: expect.closeTo(2 / 300, 10) }, // radar
        { yearMonth: "2020-01", curatedData: expect.closeTo(1 / 300, 10) }, // model
        { yearMonth: "2020-12", curatedData: expect.closeTo(1 / 300, 10) }, // model
        { yearMonth: "2021-01", curatedData: expect.closeTo(1 / 300, 10) }, // model
        { yearMonth: "2021-02", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      ],
    ));

  it("returns monthly curated model data", () =>
    expect(getStats({ dimensions: "yearMonth,curatedData", productTypes: "model" })).resolves.toMatchObject([
      { yearMonth: "2014-12", curatedData: expect.closeTo(1 / 300, 10) }, // model
      { yearMonth: "2020-01", curatedData: expect.closeTo(1 / 300, 10) }, // model
      { yearMonth: "2020-12", curatedData: expect.closeTo(1 / 300, 10) }, // model
      { yearMonth: "2021-01", curatedData: expect.closeTo(1 / 300, 10) }, // model
    ]));

  it("returns monthly curated observation data", () =>
    expect(getStats({ dimensions: "yearMonth,curatedData", productTypes: "observation" })).resolves.toMatchObject([
      { yearMonth: "2018-11", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { yearMonth: "2019-09", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { yearMonth: "2021-02", curatedData: expect.closeTo(2 / 300, 10) }, // radar
    ]));

  it("returns yearly curated total data", () =>
    expect(getStats({ dimensions: "year,curatedData", productTypes: "observation,model" })).resolves.toMatchObject([
      { year: "2014", curatedData: expect.closeTo(1 / 300, 10) }, // model
      { year: "2018", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { year: "2019", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { year: "2020", curatedData: expect.closeTo(2 / 300, 10) }, // model + model
      { year: "2021", curatedData: expect.closeTo(3 / 300, 10) }, // model + radar
    ]));

  it("returns yearly curated model data", () =>
    expect(getStats({ dimensions: "year,curatedData", productTypes: "model" })).resolves.toMatchObject([
      { year: "2014", curatedData: expect.closeTo(1 / 300, 10) }, // model
      { year: "2020", curatedData: expect.closeTo(2 / 300, 10) }, // model + model
      { year: "2021", curatedData: expect.closeTo(1 / 300, 10) }, // model
    ]));

  it("returns yearly curated observation data", () =>
    expect(getStats({ dimensions: "year,curatedData", productTypes: "observation" })).resolves.toMatchObject([
      { year: "2018", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { year: "2019", curatedData: expect.closeTo(2 / 300, 10) }, // radar
      { year: "2021", curatedData: expect.closeTo(2 / 300, 10) }, // radar
    ]));

  it("filters curated data by site", () =>
    expect(
      getStats({ dimensions: "year,curatedData", productTypes: "observation", site: "mace-head" }),
    ).resolves.toMatchObject([
      { year: "2018", curatedData: expect.closeTo(2 / 300, 10) }, // radar
    ]));

  it("filters curated data by DVAS facility", () =>
    expect(
      getStats({ dimensions: "year,curatedData", productTypes: "observation", dvasFacility: "mchd" }),
    ).resolves.toMatchObject([
      { year: "2018", curatedData: expect.closeTo(2 / 300, 10) }, // radar
    ]));
});
