import axios from "axios";
import { backendPublicUrl, genResponse } from "../../lib";
import { DataSource, Repository } from "typeorm";
import { Collection } from "../../../src/entity/Collection";
import { RegularFile } from "../../../src/entity/File";
import { AppDataSource } from "../../../src/data-source";

const url = `${backendPublicUrl}generate-pid/`;

let dataSource: DataSource;
let collRepo: Repository<Collection>;
let fileRepo: Repository<RegularFile>;

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  collRepo = dataSource.getRepository(Collection);
  fileRepo = dataSource.getRepository(RegularFile);
});

describe("POST /api/generate-pid", () => {
  afterAll(async () => await dataSource.destroy());

  it("responds with a pid and adds it to the collection", async () => {
    const file = await fileRepo.findOneByOrFail({ uuid: "38092c00-161d-4ca2-a29d-628cf8e960f6" });
    let collection = new Collection([file], []);
    await collRepo.save(collection);
    const res = await axios.post(url, { type: "collection", uuid: collection.uuid });
    expect(res.data).toHaveProperty("pid");
    collection = await collRepo.findOneByOrFail({ uuid: collection.uuid });
    expect(collection.pid).toBe(res.data.pid);
    await collRepo.remove(collection);
  });

  it("responds with 403 if collection already has a PID", async () => {
    const file = await fileRepo.findOneByOrFail({ uuid: "38092c00-161d-4ca2-a29d-628cf8e960f6" });
    const collection = new Collection([file], []);
    collection.pid = "asd";
    await collRepo.save(collection);
    const error = { errors: ["Collection already has a PID"] };
    await expect(axios.post(url, { type: "collection", uuid: collection.uuid })).rejects.toMatchObject(
      genResponse(403, error)
    );
    await collRepo.remove(collection);
  });

  it("responds with 422 if type or uuid is missing", async () => {
    const error = { errors: ["Missing or invalid uuid or type"] };
    await expect(axios.post(url, { type: "collection" })).rejects.toMatchObject(genResponse(422, error));
    return await expect(axios.post(url, { uuid: "48092c00-161d-4ca2-a29d-628cf8e960f6" })).rejects.toMatchObject(
      genResponse(422, error)
    );
  });

  it("responds with 422 on invalid type", async () => {
    const error = { errors: ["Type must be collection"] };
    return await expect(
      axios.post(url, { type: "file", uuid: "48092c00-161d-4ca2-a29d-628cf8e960f6" })
    ).rejects.toMatchObject(genResponse(422, error));
  });

  it("responds with 422 on missing uuid", async () => {
    const error = { errors: ["Collection not found"] };
    return await expect(
      axios.post(url, { type: "collection", uuid: "11092c00-161d-4ca2-a29d-628cf8e960f6" })
    ).rejects.toMatchObject(genResponse(422, error));
  });

  // TODO: fix by removing wait parameter and using another mock pid-service
  // it("responds with 504 if PID service does not respond in time", async () => {
  //   await repo.update({ uuid: validRequest.uuid }, { pid: "" });
  //   const error = { errors: ["PID service took too long to respond"] };
  //   await expect(axios.post(url, { ...validRequest, ...{ wait: true } })).rejects.toMatchObject(
  //     genResponse(504, error)
  //   );
  // });
});
