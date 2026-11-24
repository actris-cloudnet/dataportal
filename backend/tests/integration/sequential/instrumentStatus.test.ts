import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { backendPublicUrl, cleanRepos, loadFixture } from "../../lib";
import { AppDataSource } from "../../../src/data-source";
import { InstrumentUpload } from "../../../src/entity/Upload";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

const uploadUuid = "1fa2b98c-e415-4e5e-b73d-87d050e2c61c";
const instrumentUuid = "0b3a7fa0-4812-4964-af23-1162e8b3a665";
const oldInstrumentUuid = "c43e9f54-c94d-45f7-8596-223b1c2b14c0";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let dataSource: DataSource;
let uploadRepo: Repository<InstrumentUpload>;

const refreshView = () => dataSource.query("REFRESH MATERIALIZED VIEW instrument_latest_upload");

async function setLatestUpload(daysAgo: number, hoursAgo: number) {
  const now = Date.now();
  const day = new Date(now - daysAgo * DAY_MS);
  await uploadRepo.update(
    { uuid: uploadUuid },
    {
      measurementDate: new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())),
      updatedAt: new Date(now - hoursAgo * HOUR_MS),
    },
  );
  await refreshView();
}

async function getStatuses(uuid: string) {
  const [site, pids] = await Promise.all([
    axios.get(`${backendPublicUrl}uploaded-metadata`, { params: { site: "bucharest" } }),
    axios.get(`${backendPublicUrl}instrument-pids`, { params: { includeSite: 1 } }),
  ]);
  return {
    site: site.data.find((item: any) => item.instrument.uuid === uuid).status,
    pids: pids.data.find((item: any) => item.uuid === uuid).status,
  };
}

describe("instrument status", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    uploadRepo = dataSource.getRepository(InstrumentUpload);
    await cleanRepos(dataSource);
    await loadFixture(dataSource, "0-model_citation");
    await loadFixture(dataSource, "0-regular_citation");
    await loadFixture(dataSource, "1-product");
    await loadFixture(dataSource, "1-site");
    await loadFixture(dataSource, "2-instrument");
    await loadFixture(dataSource, "3-instrument_info");
    await loadFixture(dataSource, "4-instrument_upload");
  });

  afterAll(async () => await dataSource.destroy());

  it.each([
    [0, 1, "live"],
    [1, 1, "live"],
    [0, 4, "active"],
    [2, 1, "active"],
    [3, 1, "recent"],
    [6, 1, "recent"],
    [7, 1, "inactive"],
  ])("data from %i days ago uploaded %i hours ago is %s", async (daysAgo, hoursAgo, expected) => {
    await setLatestUpload(daysAgo, hoursAgo);
    expect(await getStatuses(instrumentUuid)).toEqual({ site: expected, pids: expected });
  });

  it("leaves instruments with old data inactive", async () => {
    await setLatestUpload(0, 1);
    expect(await getStatuses(oldInstrumentUuid)).toEqual({ site: "inactive", pids: "inactive" });
  });
});
