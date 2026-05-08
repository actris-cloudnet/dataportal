import { CitationService } from "../../../src/lib/cite";
import { DataCiteService } from "../../../src/lib/datacite";
import { Collection } from "../../../src/entity/Collection";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../../src/data-source";

let dataSource: DataSource;
let collectionRepo: Repository<Collection>;
let citationService: CitationService;
let dataCiteService: DataCiteService;

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  collectionRepo = dataSource.getRepository(Collection);
  citationService = new CitationService(dataSource);
  dataCiteService = new DataCiteService(citationService);
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("DataCiteService", () => {
  it("returns DataCite JSON", async () => {
    const collection = await collectionRepo.findOneByOrFail({ uuid: "48092c00-161d-4ca2-a29d-628cf8e960f6" });
    const meta = await dataCiteService.collectionDataCiteJson(collection);
    expect(meta).toMatchSnapshot();
  });
});
