import { backendPrivateUrl, backendPublicUrl, cleanRepos, loadFixture, storageServiceUrl } from "../../lib";
import axios from "axios";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../../src/data-source";
import { ModelVisualization } from "../../../src/entity/ModelVisualization";
import { beforeAll, afterEach, afterAll, describe, it, expect } from "@jest/globals";

const validJson = {
  sourceFileId: "9e04d8ef-0f2b-4823-835d-33e458403c67",
  variableId: "test1",
};

const badUuid = { ...validJson, ...{ sourceFileId: "a0fc26e4-d448-4b93-91a3-62051c9d311b" } };

const validId = "test.png";
const badId = "notfound";

let dataSource: DataSource;
let repo: Repository<ModelVisualization>;

const privUrl = `${backendPrivateUrl}visualizations/`;
const imgUrl = `${backendPublicUrl}download/image/`;

describe("PUT /visualizations", () => {
  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    await cleanRepos(dataSource);
    await loadFixture(dataSource, "0-model_citation");
    await loadFixture(dataSource, "0-regular_citation");
    await loadFixture(dataSource, "0-software");
    await loadFixture(dataSource, "1-site");
    await loadFixture(dataSource, "1-product");
    await loadFixture(dataSource, "1-model");
    await loadFixture(dataSource, "2-instrument");
    await loadFixture(dataSource, "3-product_variable");
    await loadFixture(dataSource, "3-instrument_info");
    await loadFixture(dataSource, "5-model_file");
    await loadFixture(dataSource, "5-regular_file");
    repo = dataSource.getRepository(ModelVisualization);
    await axios.put(`${storageServiceUrl}cloudnet-img/${validId}`, "content");
  });

  afterEach(async () => Promise.all([repo.delete(badId), repo.delete(validId)]).catch());

  afterAll(async () => await dataSource.destroy());

  it("on valid new visualization inserts a row to db and image is downloadable", async () => {
    const res = await axios.put(`${privUrl}${validId}`, validJson);
    expect(res.status).toEqual(201);
    await expect(repo.findOneByOrFail({ s3key: validId })).resolves.toBeTruthy();
    await expect(axios.get(`${imgUrl}${validId}`)).resolves.toMatchObject({
      status: 200,
      data: "content",
      headers: { "content-type": "image/png" },
    });
  });

  it("on invalid path responds with 400", async () =>
    await expect(axios.put(`${privUrl}${badId}`, validJson)).rejects.toMatchObject({ response: { status: 400 } }));

  it("on invalid source file uuid responds with 400", async () =>
    await expect(axios.put(`${privUrl}${validId}`, badUuid)).rejects.toMatchObject({ response: { status: 400 } }));
});
