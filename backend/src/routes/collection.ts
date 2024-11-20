import { RequestHandler } from "express";
import { Collection } from "../entity/Collection";
import { validate as validateUuid } from "uuid";
import axios from "axios";
import { DataSource, In, Raw, Repository } from "typeorm";
import { File, ModelFile, RegularFile } from "../entity/File";
import { getCollectionLandingPage, transformRawFile } from "../lib";
import env from "../lib/env";
import { CitationService } from "../lib/cite";
import { Site } from "../entity/Site";
import { Product } from "../entity/Product";

export class CollectionRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.collectionRepo = dataSource.getRepository(Collection);
    this.fileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.siteRepo = dataSource.getRepository(Site);
    this.productRepo = dataSource.getRepository(Product);
    this.citationService = new CitationService(dataSource);
  }

  readonly dataSource: DataSource;
  readonly collectionRepo: Repository<Collection>;
  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly siteRepo: Repository<Site>;
  readonly productRepo: Repository<Product>;
  readonly citationService: CitationService;

  postCollection: RequestHandler = async (req, res, next) => {
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

  collection: RequestHandler = async (req, res, next) => {
    const collection = await this.collectionRepo.findOneBy({ uuid: req.params.uuid });
    if (!collection) return next({ status: 404, errors: ["Collection not found"] });
    const [files, volatileFiles, tombstonedFiles, size, dateRange, products, sites] = await Promise.all([
      this.countFiles(collection),
      this.hasVolatileFiles(collection),
      this.hasTombstonedFiles(collection),
      this.countTotalSize(collection),
      this.getDateRange(collection),
      this.getProducts(collection),
      this.getSites(collection),
    ]);
    res.send({
      ...collection,
      ...dateRange,
      files,
      volatileFiles,
      tombstonedFiles,
      size,
      products,
      sites,
    });
  };

  collectionFiles: RequestHandler = async (req, res, next) => {
    const collection = await this.collectionRepo.findOneBy({ uuid: req.params.uuid });
    if (!collection) return next({ status: 404, errors: ["Collection not found"] });
    const currentPage = req.query.page ? parseInt(req.query.page as any) : 1;
    if (isNaN(currentPage)) return next({ status: 400, errors: ["Invalid page parameter"] });
    const pageSize = 15;
    const [fileCount, files] = await Promise.all([
      this.countFiles(collection),
      this.findFiles(collection, currentPage, pageSize),
    ]);
    res.send({
      results: files,
      pagination: {
        totalItems: fileCount,
        totalPages: Math.ceil(fileCount / pageSize),
        currentPage,
        pageSize,
      },
    });
  };

  generatePid: RequestHandler = async (req, res, next) => {
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
          language: "en",
          dates: [
            { date: citation.createdAt, dateType: "Created" },
            { date: `${citation.startDate}/${citation.endDate}`, dateType: "Collected" },
          ],
          formats: ["application/zip", "application/netcdf"],
          rightsList: [
            {
              lang: "en",
              schemeURI: "https://spdx.org/licenses/",
              rightsIdentifierScheme: "SPDX",
              rightsIdentifier: "CC-BY-4.0",
              rightsURI: "https://creativecommons.org/licenses/by/4.0/",
              rights: "Creative Commons Attribution 4.0 International",
            },
          ],
          geoLocations: citation.locations.map((location) => ({
            geoLocationPlace: location.name,
            geoLocationPoint:
              location.latitude && location.longitude
                ? {
                    pointLatitude: location.latitude,
                    pointLongitude: location.longitude,
                  }
                : undefined,
          })),
        },
      },
    };
  }

  private async countFiles(collection: Collection) {
    const [regularFiles, modelFiles] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) AS files
         FROM collection_regular_files_regular_file
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS files
         FROM collection_model_files_model_file
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
    ]);
    return parseInt(regularFiles[0].files) + parseInt(modelFiles[0].files);
  }

  private async hasVolatileFiles(collection: Collection) {
    const [regularFiles, modelFiles] = await Promise.all([
      this.dataSource.query(
        `SELECT 1
         FROM collection_regular_files_regular_file
         JOIN regular_file ON "regularFileUuid" = uuid
         WHERE "collectionUuid" = $1
         AND volatile = true
         LIMIT 1`,
        [collection.uuid],
      ),
      this.dataSource.query(
        `SELECT 1
         FROM collection_model_files_model_file
         JOIN model_file ON "modelFileUuid" = uuid
         WHERE "collectionUuid" = $1
         AND volatile = true
         LIMIT 1`,
        [collection.uuid],
      ),
    ]);
    return regularFiles.length > 0 || modelFiles.length > 0;
  }

  private async hasTombstonedFiles(collection: Collection) {
    const [regularFiles, modelFiles] = await Promise.all([
      this.dataSource.query(
        `SELECT 1
         FROM collection_regular_files_regular_file
         JOIN regular_file ON "regularFileUuid" = uuid
         WHERE "collectionUuid" = $1
         AND "tombstoneReason" IS NOT NULL
         LIMIT 1`,
        [collection.uuid],
      ),
      this.dataSource.query(
        `SELECT 1
         FROM collection_model_files_model_file
         JOIN model_file ON "modelFileUuid" = uuid
         WHERE "collectionUuid" = $1
         AND "tombstoneReason" IS NOT NULL
         LIMIT 1`,
        [collection.uuid],
      ),
    ]);
    return regularFiles.length > 0 || modelFiles.length > 0;
  }

  private async countTotalSize(collection: Collection) {
    const [regularFiles, modelFiles] = await Promise.all([
      this.dataSource.query(
        `SELECT SUM(size) AS size
         FROM collection_regular_files_regular_file
         JOIN regular_file ON "regularFileUuid" = uuid
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
      this.dataSource.query(
        `SELECT SUM(size) AS size
         FROM collection_model_files_model_file
         JOIN model_file ON "modelFileUuid" = uuid
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
    ]);
    return parseInt(regularFiles[0].size) + parseInt(modelFiles[0].size);
  }

  private async getDateRange(collection: Collection) {
    const [regularFiles, modelFiles] = await Promise.all([
      this.dataSource.query(
        `SELECT to_char(MIN("measurementDate"), 'YYYY-MM-DD') AS "startDate",
                to_char(MAX("measurementDate"), 'YYYY-MM-DD') AS "endDate"
         FROM collection_regular_files_regular_file
         JOIN regular_file ON "regularFileUuid" = uuid
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
      this.dataSource.query(
        `SELECT to_char(MIN("measurementDate"), 'YYYY-MM-DD') AS "startDate",
                to_char(MAX("measurementDate"), 'YYYY-MM-DD') AS "endDate"
         FROM collection_model_files_model_file
         JOIN model_file ON "modelFileUuid" = uuid
         WHERE "collectionUuid" = $1`,
        [collection.uuid],
      ),
    ]);
    return {
      startDate:
        regularFiles[0].startDate < modelFiles[0].startDate ? regularFiles[0].startDate : modelFiles[0].startDate,
      endDate: regularFiles[0].endDate < modelFiles[0].endDate ? regularFiles[0].endDate : modelFiles[0].endDate,
    };
  }

  private async getProducts(collection: Collection) {
    return await this.productRepo.findBy({
      id: Raw(
        (alias) => `
          ${alias} IN (SELECT "productId"
                       FROM collection_regular_files_regular_file
                       JOIN regular_file ON "regularFileUuid" = uuid
                       WHERE "collectionUuid" = :uuid)
          OR
          ${alias} IN (SELECT "productId"
                       FROM collection_model_files_model_file
                       JOIN model_file ON "modelFileUuid" = uuid
                       WHERE "collectionUuid" = :uuid)`,
        { uuid: collection.uuid },
      ),
    });
  }

  private async getSites(collection: Collection) {
    return await this.siteRepo.findBy({
      id: Raw(
        (alias) => `
          ${alias} IN (SELECT "siteId"
                       FROM collection_regular_files_regular_file
                       JOIN regular_file ON "regularFileUuid" = uuid
                       WHERE "collectionUuid" = :uuid)
          OR
          ${alias} IN (SELECT "siteId"
                       FROM collection_model_files_model_file
                       JOIN model_file ON "modelFileUuid" = uuid
                       WHERE "collectionUuid" = :uuid)`,
        { uuid: collection.uuid },
      ),
    });
  }

  private async findFiles(collection: Collection, page: number, pageSize: number) {
    const select = `
      file.uuid AS file_uuid,
      file."measurementDate" AS "file_measurementDate",
      file.volatile AS file_volatile,
      file.legacy AS file_legacy,
      file."tombstoneReason" AS "file_tombstoneReason",
      site.id AS "site_id",
      site."humanReadableName" AS "site_humanReadableName",
      site.country AS "site_country",
      product.id AS "product_id",
      product."humanReadableName" AS "product_humanReadableName",
      product.level AS "product_level",
      product."experimental" AS "product_experimental"
    `;
    const join = `
      JOIN site ON "siteId" = site.id
      JOIN product ON "productId" = product.id
    `;
    const files = await this.dataSource.query(
      `SELECT ${select}
       FROM collection_regular_files_regular_file
       JOIN regular_file file ON "regularFileUuid" = file.uuid
       ${join}
       WHERE "collectionUuid" = $1
       UNION
       SELECT ${select}
       FROM collection_model_files_model_file
       JOIN model_file file ON "modelFileUuid" = file.uuid
       ${join}
       WHERE "collectionUuid" = $1
       ORDER BY "file_measurementDate" DESC,
                site_id ASC,
                product_level ASC,
                product_id ASC
       LIMIT $2
       OFFSET $3`,
      [collection.uuid, pageSize, pageSize * (page - 1)],
    );
    return files.map((row: any) => transformRawFile(row, "file"));
  }
}
