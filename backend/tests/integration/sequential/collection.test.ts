import axios from "axios";
import { backendPublicUrl, genResponse } from "../../lib";
import { DataSource, Repository } from "typeorm";
import { Collection } from "../../../src/entity/Collection";
import { promises as fsp } from "node:fs";
import { File, ModelFile, RegularFile } from "../../../src/entity/File";
import { AppDataSource } from "../../../src/data-source";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";

let dataSource: DataSource;
let repo: Repository<Collection>;
let fileRepo: Repository<File>;
const url = `${backendPublicUrl}collection/`;

const validFileUuids = ["38092c00-161d-4ca2-a29d-628cf8e960f6", "bde7a35f-03aa-4bff-acfb-b4974ea9f217"];

describe("POST /api/collection", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    repo = dataSource.getRepository(Collection);
    fileRepo = dataSource.getRepository(RegularFile);
    await dataSource
      .getRepository(ModelFile)
      .save(JSON.parse((await fsp.readFile("fixtures/5-model_file.json")).toString()));
    await fileRepo.save(JSON.parse((await fsp.readFile("fixtures/5-regular_file.json")).toString()));
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
});
