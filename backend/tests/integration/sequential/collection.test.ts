import axios from "axios";
import { backendPublicUrl, genResponse, cleanRepos, loadFixture } from "../../lib";
import { DataSource, Repository } from "typeorm";
import { Collection } from "../../../src/entity/Collection";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let repo: Repository<Collection>;
const url = `${backendPublicUrl}collection/`;

const validFileUuids = ["38092c00-161d-4ca2-a29d-628cf8e960f6", "bde7a35f-03aa-4bff-acfb-b4974ea9f217"];

describe("POST /api/collection", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    await cleanRepos(dataSource);
    await loadFixture(dataSource, "0-model_citation");
    await loadFixture(dataSource, "0-regular_citation");
    await loadFixture(dataSource, "0-software");
    await loadFixture(dataSource, "1-model");
    await loadFixture(dataSource, "1-product");
    await loadFixture(dataSource, "1-site");
    await loadFixture(dataSource, "2-instrument");
    await loadFixture(dataSource, "3-instrument_info");
    await loadFixture(dataSource, "5-model_file");
    await loadFixture(dataSource, "5-regular_file");
    repo = dataSource.getRepository(Collection);
  });

  beforeEach(async () => {
    await repo.createQueryBuilder().delete().execute();
  });

  afterAll(async () => await dataSource.destroy());

  it("on valid new collection inserts a row to db and responds with uuid", async () => {
    const res = await axios.post(url, { files: validFileUuids });
    await expect(repo.findOneByOrFail({ uuid: res.data })).resolves.toBeTruthy();
  });

  it("on invalid request responds with 422", async () => {
    await expect(axios.post(url, { file: validFileUuids })).rejects.toMatchObject(
      genResponse(422, { errors: ['Request is missing field "files"'] }),
    );
  });

  it("on missing files responds with 422", async () => {
    const missingUuid = validFileUuids.concat(["48092c00-161d-4ca2-a29d-628cf8e960f6"]);
    await expect(axios.post(url, { files: missingUuid })).rejects.toMatchObject(
      genResponse(422, { errors: ["Following files do not exist: 48092c00-161d-4ca2-a29d-628cf8e960f6"] }),
    );
  });

  it("on non-downloadable files responds with 422", async () => {
    const missingUuid = validFileUuids.concat(["592a73d0-92a0-41d4-97c5-9f3e99ce33cb"]);
    await expect(axios.post(url, { files: missingUuid })).rejects.toMatchObject(
      genResponse(422, { errors: ["Following files are not downloadable: 592a73d0-92a0-41d4-97c5-9f3e99ce33cb"] }),
    );
  });
});
