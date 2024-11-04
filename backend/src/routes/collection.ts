import { Request, RequestHandler, Response } from "express";
import { Collection } from "../entity/Collection";
import { CollectionResponse } from "../entity/CollectionResponse";
import { validate as validateUuid } from "uuid";
import axios from "axios";
import { DataSource, In, Repository } from "typeorm";
import { File, ModelFile, RegularFile } from "../entity/File";
import { getCollectionLandingPage, convertToSearchResponse } from "../lib";
import env from "../lib/env";
import { CitationService } from "../lib/cite";

export class CollectionRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.collectionRepo = dataSource.getRepository(Collection);
    this.fileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.citationService = new CitationService(dataSource);
  }

  readonly dataSource: DataSource;
  readonly collectionRepo: Repository<Collection>;
  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly citationService: CitationService;

  postCollection: RequestHandler = async (req: Request, res: Response, next) => {
    if (
      !("files" in req.body) ||
      !req.body.files ||
      !Array.isArray(req.body.files) ||
      !req.body.files.every((file: any) => typeof file == "string")
    ) {
      return next({ status: 422, errors: ['Request is missing field "files"'] });
    }
    const fileUuids: string[] = req.body.files;
    if (fileUuids.length > 10_000) {
      return next({ status: 422, errors: ["Maximum of 10 000 files is supported"] });
    }
    const [files, modelFiles] = await Promise.all([
      this.fileRepo.findBy({ uuid: In(fileUuids) }),
      this.modelFileRepo.findBy({ uuid: In(fileUuids) }),
    ]);
    if ((files as unknown as File[]).concat(modelFiles).length != fileUuids.length) {
      const existingUuids = files.map((file) => file.uuid);
      const missingFiles = fileUuids.filter((uuid) => !existingUuids.includes(uuid));
      return next({ status: 422, errors: [`Following files do not exist: ${missingFiles}`] });
    }
    const collection = await this.collectionRepo.save(new Collection(files, modelFiles));
    res.send(collection.uuid);
  };

  collection: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid: string = req.params.uuid;
    const collection = await this.findCollection(uuid);
    if (!collection) return next({ status: 404, errors: ["Collection not found"] });
    res.send(new CollectionResponse(collection));
  };

  generatePid: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    if (!body.uuid || !body.type || !validateUuid(body.uuid)) {
      return next({ status: 422, errors: ["Missing or invalid uuid or type"] });
    }
    if (body.type != "collection") {
      return next({ status: 422, errors: ["Type must be collection"] });
    }
    try {
      const collection = await this.collectionRepo.findOneBy({ uuid: body.uuid });
      if (!collection) {
        return next({ status: 422, errors: ["Collection not found"] });
      }
      if (collection.pid) {
        return next({ status: 403, errors: ["Collection already has a PID"] });
      }
      collection.pid = await this.mintDoi(collection);
      await this.collectionRepo.save(collection);
      res.send({ pid: collection.pid });
    } catch (e: any) {
      if (axios.isAxiosError(e)) {
        console.error(
          JSON.stringify({
            err: `AxiosError: ${e.message}`,
            req: e.request && { url: e.request.url, body: e.request.body },
            res: e.response && { status: e.response.status, data: e.response.data },
          }),
        );
      }
      if (e.code && e.code == "ECONNABORTED") {
        return next({ status: 504, errors: ["PID service took too long to respond"] });
      }
      return next({ status: 500, errors: e });
    }
  };

  private async mintDoi(collection: Collection): Promise<string> {
    const pidRes = await axios.post(`${env.DATACITE_API_URL}/dois`, await this.collectionDataCite(collection), {
      headers: { "Content-Type": "application/vnd.api+json" },
      auth: { username: env.DATACITE_API_USERNAME, password: env.DATACITE_API_PASSWORD },
      timeout: env.DATACITE_API_TIMEOUT_MS,
    });
    return `${env.DATACITE_DOI_SERVER}/${pidRes.data.data.attributes.doi}`;
  }

  private async collectionDataCite(collection: Collection): Promise<object> {
    const doiSuffix = collection.uuid.toLowerCase().replace(/-/g, "").slice(0, 16);
    const citation = await this.citationService.getCollectionCitation(collection);
    const creators = citation.authors.map((person) => ({
      name: `${person.lastName}, ${person.firstName}`,
      nameType: "Personal",
      givenName: person.firstName,
      familyName: person.lastName,
      nameIdentifiers: person.orcid
        ? [
            {
              schemeUri: "https://orcid.org",
              nameIdentifier: `https://orcid.org/${person.orcid}`,
              nameIdentifierScheme: "ORCID",
            },
          ]
        : undefined,
    }));
    return {
      data: {
        type: "dois",
        attributes: {
          event: "publish",
          doi: `${env.DATACITE_DOI_PREFIX}/${doiSuffix}`,
          creators,
          titles: [{ lang: "en", title: citation.title }],
          publisher: citation.publisher,
          publicationYear: citation.year,
          types: { resourceTypeGeneral: "Dataset" },
          url: getCollectionLandingPage(collection),
          schemaVersion: "http://datacite.org/schema/kernel-4",
        },
      },
    };
  }

  allcollections: RequestHandler = async (req: Request, res: Response, next) => {
    const collections = await this.collectionRepo.find({
      relations: {
        regularFiles: { site: true, product: true },
        modelFiles: { site: true, product: true },
      },
    });
    const response = collections.map((coll) => ({
      ...coll,
      ...{ files: coll.regularFiles.map(convertToSearchResponse) },
    }));
    res.send(response);
  };

  public async findCollection(uuid: string): Promise<Collection | null> {
    const collection = await this.collectionRepo.findOneBy({ uuid });
    if (!collection) return null;
    const regularFileIds = await this.collectionRepo.query(
      'SELECT "regularFileUuid" from collection_regular_files_regular_file WHERE "collectionUuid" = $1',
      [uuid],
    );
    const regularFiles = await this.fileRepo.find({
      where: { uuid: In(regularFileIds.map((obj: any) => obj.regularFileUuid)) },
      relations: { site: true, product: true },
    });

    const modelFileIds = await this.collectionRepo.query(
      'SELECT "modelFileUuid" from collection_model_files_model_file WHERE "collectionUuid" = $1',
      [uuid],
    );
    const modelFiles = await this.modelFileRepo.find({
      where: { uuid: In(modelFileIds.map((obj: any) => obj.modelFileUuid)) },
      relations: { site: true, product: true, model: true },
    });
    return { ...collection, regularFiles, modelFiles } as Collection;
  }
}
