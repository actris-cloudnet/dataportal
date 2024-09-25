import { Request, RequestHandler, Response } from "express";
import { Collection } from "../entity/Collection";
import {
  EntityManager,
  Repository,
  SelectQueryBuilder,
  In,
  DataSource,
  ObjectLiteral,
  Raw,
  QueryRunner,
  FindOneOptions,
} from "typeorm";
import { File, isFile, RegularFile } from "../entity/File";
import { FileQuality } from "../entity/FileQuality";
import {
  checkFileExists,
  convertToReducedResponse,
  convertToSearchResponse,
  getS3pathForFile,
  hideTestDataFromNormalUsers,
  sortByMeasurementDateAsc,
  toArray,
  dateforsize,
  streamHandler,
  fixInstrument,
} from "../lib";
import { augmentFile } from "../lib/";
import { SearchFile } from "../entity/SearchFile";
import { Model } from "../entity/Model";
import { basename } from "path";
import { ModelFile } from "../entity/File";
import { SearchFileResponse } from "../entity/SearchFileResponse";
import { Visualization } from "../entity/Visualization";
import { ModelVisualization } from "../entity/ModelVisualization";
import { Product } from "../entity/Product";
import { SoftwareService } from "../lib/software";
import { InstrumentInfo } from "../entity/Instrument";

export class FileRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.collectionRepo = dataSource.getRepository(Collection);
    this.fileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.searchFileRepo = dataSource.getRepository(SearchFile);
    this.visualizationRepo = dataSource.getRepository(Visualization);
    this.modelVisualizationRepo = dataSource.getRepository(ModelVisualization);
    this.productRepo = dataSource.getRepository(Product);
    this.fileQualityRepo = dataSource.getRepository(FileQuality);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.softwareService = new SoftwareService(dataSource);
  }

  readonly dataSource: DataSource;
  readonly collectionRepo: Repository<Collection>;
  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly searchFileRepo: Repository<SearchFile>;
  readonly visualizationRepo: Repository<Visualization>;
  readonly modelVisualizationRepo: Repository<ModelVisualization>;
  readonly productRepo: Repository<Product>;
  readonly fileQualityRepo: Repository<FileQuality>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly softwareService: SoftwareService;

  file: RequestHandler = async (req: Request, res: Response, next) => {
    const getFileByUuid = (repo: any, isModel: boolean | undefined) => {
      const qb = repo
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.product", "product")
        .leftJoinAndSelect("file.software", "software")
        .orderBy('COALESCE(software."humanReadableName", software.code)', "ASC");
      if (isModel) {
        qb.leftJoinAndSelect("file.model", "model");
      } else {
        qb.leftJoinAndSelect("file.instrument", "instrument");
        qb.leftJoinAndSelect("file.instrumentInfo", "instrumentInfo");
        qb.leftJoinAndSelect("file.sourceRegularFiles", "sourceRegularFiles");
        qb.leftJoinAndSelect("file.sourceModelFiles", "sourceModelFiles");
      }
      qb.where("file.uuid = :uuid", req.params);
      return hideTestDataFromNormalUsers(qb, req).getOne();
    };

    try {
      const file = await this.findAnyFile(getFileByUuid);
      if (!file) {
        return next({ status: 404, errors: ["No files match this UUID"] });
      }
      res.send(augmentFile(false)(file));
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  fileVersions: RequestHandler = async (req: Request, res: Response, next) => {
    const getFileByUuid = (repo: Repository<RegularFile> | Repository<ModelFile>, _isModel: boolean | undefined) =>
      repo.createQueryBuilder("file").where("file.uuid = :uuid", req.params).getOne();

    try {
      const select: any = ["uuid", "createdAt"];
      const allowedProps = ["pid", "dvasId", "legacy", "checksum", "size", "format"];
      const extraProps = toArray(req.query.properties as any) || [];
      const unknownProps = [];
      for (const prop of extraProps) {
        if (allowedProps.includes(prop)) {
          select.push(prop);
        } else {
          unknownProps.push(prop);
        }
      }
      if (unknownProps.length > 0) {
        return next({
          status: 400,
          errors: [`Unknown values in properties query parameter: ${unknownProps.join(", ")}`],
        });
      }

      const file = await this.findAnyFile(getFileByUuid);
      if (!file) {
        return next({ status: 404, errors: ["No files match this UUID"] });
      }
      const repo = file instanceof RegularFile ? this.fileRepo : this.modelFileRepo;
      // Handle legacy filenames with 'legacy/' prefix.
      const filename = Raw((alias) => `regexp_replace(${alias}, '.+/', '') = :filename`, { filename: file.filename });
      const versions = await repo.find({
        select,
        where: { s3key: filename },
        order: { createdAt: "DESC" },
      });
      res.send(versions);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  files: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any;
    try {
      const stream = await this.filesQueryBuilder(query, "file").stream();
      streamHandler(stream, res, "file", augmentFile(query.s3path));
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  modelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any;
    try {
      const stream = await this.filesQueryBuilder(query, "model").stream();
      streamHandler(stream, res, "file", augmentFile(query.s3path));
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  search: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any;
    const converterFunction = query.properties
      ? convertToReducedResponse(toArray(query.properties) as (keyof SearchFileResponse)[])
      : convertToSearchResponse;

    try {
      const qb = this.searchFilesQueryBuilder(query);
      if ("page" in query) {
        const currentPage = parseInt(query.page);
        const pageSize = "pageSize" in query ? parseInt(query.pageSize) : 15;
        const offset = (currentPage - 1) * pageSize;
        const sizeQb = qb.clone().select("SUM(size)", "totalBytes").orderBy();
        const pageQb = qb.clone().limit(pageSize).offset(offset);
        const [totalItems, size, pageItems] = await Promise.all([qb.getCount(), sizeQb.getRawOne(), pageQb.getMany()]);
        const totalPages = Math.ceil(totalItems / pageSize);
        res.send({
          results: pageItems,
          pagination: {
            totalItems,
            totalPages,
            totalBytes: parseInt(size.totalBytes),
            currentPage,
            pageSize,
          },
        });
      } else {
        const stream = await qb.stream();
        streamHandler(stream, res, "file", converterFunction);
      }
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  putFile: RequestHandler = async (req: Request, res: Response, next) => {
    const file = req.body;
    file.s3key = req.params[0];
    file.updatedAt = new Date();
    if (!isFile(file))
      return next({ status: 422, errors: ["Request body is missing fields or has invalid values in them"] });
    if (!isValidFilename(file)) return next({ status: 400, errors: ["Filename does not match file metadata"] });
    const isModel = file.model && true;

    const sourceFileIds = req.body.sourceFileIds || [];
    if (!Array.isArray(sourceFileIds) || sourceFileIds.some((id) => typeof id !== "string")) {
      return next({ status: 422, errors: ["sourceFileIds must be array of strings"] });
    }
    try {
      const sourceFiles = await Promise.all(
        sourceFileIds.map(
          async (uuid) => (await this.findAnyFile((repo) => repo.findOneBy({ uuid }))) || Promise.reject(),
        ),
      );
      file.sourceRegularFiles = sourceFiles.filter((file) => file instanceof RegularFile);
      file.sourceModelFiles = sourceFiles.filter((file) => file instanceof ModelFile);
    } catch (e) {
      return next({ status: 422, errors: ["One or more of the specified source files were not found"] });
    }

    try {
      await checkFileExists(getS3pathForFile(file));
    } catch (e) {
      console.error(e);
      return next({ status: 400, errors: ["The specified file was not found in storage service"] });
    }

    if (file.software) {
      file.software = await Promise.all(
        Object.entries(file.software).map(async ([code, version]) =>
          this.softwareService.getSoftware(code, version as string),
        ),
      );
    }

    if (file.instrumentPid) {
      file.instrumentInfo = await this.instrumentInfoRepo.findOne({
        where: { pid: file.instrumentPid },
        relations: { instrument: true },
      });
      if (!file.instrumentInfo) {
        return next({ status: 422, errors: "Unknown instrument PID" });
      }
      if (file.instrument) {
        file.instrument = fixInstrument(file.instrument, file.instrumentInfo);
        if (!file.instrument) {
          return next({ status: 422, errors: "Instrument doesn't match instrument PID" });
        }
      }
    }

    try {
      const findFileByName = (model: boolean) => {
        const repo = model ? this.modelFileRepo : this.fileRepo;
        const qb = repo.createQueryBuilder("file");
        if (!model)
          qb.innerJoin(
            (sub_qb) => sub_qb.from("search_file", "searchfile"),
            "best_version",
            "file.uuid = best_version.uuid",
          );
        return qb
          .leftJoinAndSelect("file.site", "site")
          .where("regexp_replace(s3key, '.+/', '') = :filename", { filename: basename(file.s3key) }) // eslint-disable-line quotes
          .getOne();
      };
      const existingFile = await findFileByName(isModel);
      const searchFile = new SearchFile(file as RegularFile | ModelFile);
      const FileClass = isModel ? ModelFile : RegularFile;
      if (!existingFile) {
        // New file
        file.createdAt = file.updatedAt;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
          if (isModel) {
            await FileRoutes.updateModelSearchFile(transactionalEntityManager, file, searchFile);
          } else {
            await transactionalEntityManager.insert(SearchFile, searchFile);
          }
          await transactionalEntityManager.save(FileClass, file);
        });
        res.sendStatus(201);
      } else if (existingFile.site.isTestSite || existingFile.volatile || isModel) {
        // Replace existing
        if (existingFile.uuid != file.uuid) {
          return next({ status: 501, errors: ["UUID should match the existing file"] });
        }
        file.createdAt = existingFile.createdAt;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.save(FileClass, file);
          await transactionalEntityManager.update(SearchFile, { uuid: file.uuid }, searchFile);
        });
        res.sendStatus(200);
      } else if (existingFile.uuid != file.uuid) {
        // New version
        await this.dataSource.transaction(async (transactionalEntityManager) => {
          file.createdAt = file.updatedAt;
          await transactionalEntityManager.save(FileClass, file);
          if (!file.legacy) {
            // Don't display legacy files in search if cloudnet version is available
            await transactionalEntityManager.delete(SearchFile, { uuid: existingFile.uuid });
            await transactionalEntityManager.insert(SearchFile, searchFile);
          }
        });
        res.sendStatus(200);
      } else {
        next({
          status: 403,
          errors: ["File exists and cannot be updated since it is freezed and not from a test site"],
        });
      }
    } catch (e) {
      next({ status: 500, errors: e });
    }
  };

  postFile: RequestHandler = async (req: Request, res: Response, next) => {
    const partialFile = req.body;
    if (!partialFile.uuid) return next({ status: 422, errors: ["Request body is missing uuid"] });
    try {
      const existingFile = await this.findAnyFile((repo) => repo.findOne({ where: { uuid: partialFile.uuid } }));
      if (!existingFile) return next({ status: 422, errors: ["No file matches the provided uuid"] });
      const repo = existingFile instanceof RegularFile ? this.fileRepo : this.modelFileRepo;
      await repo.update({ uuid: partialFile.uuid }, partialFile);
      ["pid", "checksum", "version", "dvasUpdatedAt", "dvasId"].forEach((prop) => {
        // Not in SearchFile
        if (prop in partialFile) {
          delete partialFile[prop];
        }
      });
      if (await this.searchFileRepo.findOneBy({ uuid: partialFile.uuid }))
        await this.searchFileRepo.update({ uuid: partialFile.uuid }, partialFile);
      res.sendStatus(200);
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  deleteFile: RequestHandler = async (req: Request, res: Response, next) => {
    const query: any = req.query;
    const dryRun = query.dryRun;
    const uuid = req.params.uuid;
    const tombstoneReason = query.tombstoneReason;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const file = await this.simpleFindAnyFile(queryRunner, {
        where: { uuid },
        relations: { product: true, site: true },
      });
      if (!file) {
        await queryRunner.rollbackTransaction();
        return next({ status: 422, errors: ["No file matches the provided uuid"] });
      }
      if (!dryRun && !tombstoneReason && file.pid) {
        await queryRunner.rollbackTransaction();
        return next({ status: 422, errors: ["Forbidden to delete a stable file without specifying tombstone reason"] });
      }
      const uuids = await this.getDerivedProducts(queryRunner, file);
      const derivedFiles = await queryRunner.manager.find(RegularFile, {
        where: { uuid: In(uuids) },
        relations: { product: true, site: true },
      });
      if (!dryRun) {
        if (query.deleteHigherProducts && derivedFiles.length > 0) {
          if (!tombstoneReason && derivedFiles.some((product) => product.pid)) {
            await queryRunner.rollbackTransaction();
            return next({
              status: 422,
              errors: ["Forbidden to delete derived stable files without specifying tombstone reason"],
            });
          }
          for (const derivedFile of derivedFiles) {
            await this.deleteFileEntity(queryRunner, derivedFile, tombstoneReason);
          }
        }
        await this.deleteFileEntity(queryRunner, file, tombstoneReason);
      }
      await queryRunner.commitTransaction();
      res.send([file, ...derivedFiles]);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return next({ status: 500, errors: e });
    } finally {
      await queryRunner.release();
    }
  };

  allfiles: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo
      .find({ relations: { site: true, product: true } })
      .then((result) => res.send(sortByMeasurementDateAsc(result).map(augmentFile(false))))
      .catch((err) => next({ status: 500, errors: err }));

  allsearch: RequestHandler = async (req: Request, res: Response, next) =>
    this.searchFileRepo
      .find({ relations: { site: true, product: true } })
      .then((result) => {
        res.send(sortByMeasurementDateAsc(result).map(convertToSearchResponse));
      })
      .catch((err) => next({ status: 500, errors: err }));

  filesQueryBuilder(query: any, mode: "file" | "model") {
    const isModel = mode == "model";
    let repo: Repository<RegularFile> | Repository<ModelFile> = this.fileRepo;
    if (isModel) {
      repo = this.modelFileRepo;
    }
    let qb = repo
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.site", "site")
      .leftJoinAndSelect("file.product", "product");
    if (isModel) qb.leftJoinAndSelect("file.model", "model");
    if (!isModel) qb.leftJoinAndSelect("file.instrument", "instrument");

    // Where clauses
    qb = addCommonFilters(qb, query);

    if (isModel && query.model) qb.andWhere("model.id IN (:...model)", query);
    if (!isModel && query.instrument) qb.andWhere("file.instrument IN (:...instrument)", query);

    // Hack to prevent loading of model files when instrument is selected without product
    if (isModel && (query.instrument || query.instrumentPid)) qb.andWhere("1 = 0");

    if (query.filename) qb.andWhere("regexp_replace(s3key, '.+/', '') IN (:...filename)", query); // eslint-disable-line quotes
    if (query.releasedBefore) qb.andWhere("file.updatedAt < :releasedBefore", query);
    if (query.updatedAtFrom) qb.andWhere("file.updatedAt >= :updatedAtFrom", query);
    if (query.updatedAtTo) qb.andWhere("file.updatedAt <= :updatedAtTo", query);
    if (!isModel && query.instrumentPid) qb.andWhere("file.instrumentPid IN (:...instrumentPid)", query);
    if (query.dvasUpdated) {
      const value = query.dvasUpdated.toLowerCase();
      if (value == "true") qb.andWhere("file.dvasUpdatedAt IS NOT NULL");
      if (value == "false") qb.andWhere("file.dvasUpdatedAt IS NULL");
    }

    // No allVersions, allModels or model/filename params (default)
    if (
      query.allVersions == undefined &&
      query.model == undefined &&
      query.allModels == undefined &&
      !(isModel && query.filename)
    ) {
      // On model route we want to return all models if filename is specified
      qb.innerJoin(
        (
          sub_qb, // Default functionality
        ) => sub_qb.from("search_file", "searchfile"),
        "best_version",
        "file.uuid = best_version.uuid",
      );
    }

    // Ordering
    if (query.privateFrontendOrder) {
      qb.orderBy("file.measurementDate", "DESC")
        .addOrderBy("file.siteId", "ASC")
        .addOrderBy("product.level", "ASC")
        .addOrderBy("product.id", "ASC");
      if (isModel) {
        qb.addOrderBy("model.optimumOrder", "ASC");
      } else {
        qb.addOrderBy("instrument.id", "ASC").addOrderBy("file.instrumentPid", "ASC");
      }
    } else {
      // Legacy order to show version in chronological order.
      qb.orderBy("file.measurementDate", "DESC");
      if (isModel) qb.addOrderBy("model.optimumOrder", "ASC");
      qb.addOrderBy("file.legacy", "ASC").addOrderBy("file.updatedAt", "DESC");
    }

    // Limit
    if ("limit" in query) qb.limit(parseInt(query.limit));

    return qb;
  }

  searchFilesQueryBuilder(query: any) {
    let qb = this.searchFileRepo
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.site", "site")
      .leftJoinAndSelect("file.product", "product")
      .leftJoinAndSelect("file.instrument", "instrument");
    qb = addCommonFilters(qb, query);
    if (query.instrument) qb.andWhere("instrument.id IN (:...instrument)", query);
    if (query.instrumentPid) qb.andWhere("file.instrumentPid IN (:...instrumentPid)", query);
    if (query.collection) {
      qb.andWhere(
        `(file.uuid IN (SELECT "regularFileUuid" FROM collection_regular_files_regular_file WHERE "collectionUuid" = :collection) OR
          file.uuid IN (SELECT "modelFileUuid"   FROM collection_model_files_model_file     WHERE "collectionUuid" = :collection))`,
        query,
      );
    }
    qb.orderBy("file.measurementDate", "DESC")
      .addOrderBy("file.siteId", "ASC")
      .addOrderBy("product.level", "ASC")
      .addOrderBy("product.id", "ASC")
      .addOrderBy("instrument.id", "ASC")
      .addOrderBy("file.instrumentPid", "ASC");
    if ("limit" in query) qb.limit(parseInt(query.limit));
    return qb;
  }

  private static async updateModelSearchFile(
    transactionalEntityManager: EntityManager,
    file: any,
    searchFile: SearchFile,
  ) {
    const { optimumOrder } = await transactionalEntityManager.findOneByOrFail(Model, { id: file.model });
    const [bestModelFile] = await transactionalEntityManager
      .createQueryBuilder(ModelFile, "file")
      .leftJoinAndSelect("file.site", "site")
      .leftJoinAndSelect("file.product", "product")
      .leftJoinAndSelect("file.model", "model")
      .andWhere("site.id = :site", file)
      .andWhere("product.id = :product", file)
      .andWhere("file.measurementDate = :measurementDate", file)
      .addOrderBy("model.optimumOrder", "ASC")
      .getMany();
    if (!bestModelFile) return transactionalEntityManager.insert(SearchFile, searchFile);
    if (bestModelFile.model.optimumOrder >= optimumOrder) {
      await transactionalEntityManager.delete(SearchFile, {
        site: file.site,
        product: file.product,
        measurementDate: file.measurementDate,
      });
      await transactionalEntityManager.insert(SearchFile, searchFile);
    }
  }

  private async simpleFindAnyFile(queryRunner: QueryRunner, options: FindOneOptions<File>) {
    const [file, modelFile] = await Promise.all([
      queryRunner.manager.findOne<RegularFile>(RegularFile, options),
      queryRunner.manager.findOne<ModelFile>(ModelFile, options),
    ]);
    return file || modelFile;
  }

  public async findAnyFile(
    searchFunc: (arg0: any, arg1?: boolean) => Promise<RegularFile | ModelFile | null>,
  ): Promise<RegularFile | ModelFile | null> {
    const [file, modelFile] = await Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true),
    ]);
    return file || modelFile;
  }

  async findAllFiles(
    searchFunc: (
      arg0: Repository<RegularFile> | Repository<ModelFile>,
      arg1?: boolean,
    ) => Promise<(RegularFile | ModelFile)[]>,
  ): Promise<(RegularFile | ModelFile)[]> {
    const [files, modelFiles] = await Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true),
    ]);
    return files.concat(modelFiles);
  }

  dateforsize: RequestHandler = async (req, res, next) => {
    const isModel = "model" in req.query;
    return dateforsize(
      isModel ? this.modelFileRepo : this.fileRepo,
      isModel ? "model_file" : "regular_file",
      req,
      res,
      next,
    );
  };

  private async deleteFileEntity(queryRunner: QueryRunner, file: File, tombstoneReason?: string) {
    if (!file.pid) {
      const VizEntity = file instanceof RegularFile ? Visualization : ModelVisualization;
      await queryRunner.manager.delete(VizEntity, { sourceFile: { uuid: file.uuid } });
      await queryRunner.manager.delete(file.constructor, { uuid: file.uuid });
      await queryRunner.manager.delete(SearchFile, { uuid: file.uuid });
      await queryRunner.manager.delete(FileQuality, { uuid: file.uuid });
    } else {
      if (!tombstoneReason) {
        throw new Error("tombstoneReason is required for stable file");
      }
      file.tombstoneReason = tombstoneReason;
      await queryRunner.manager.save(file);
      await queryRunner.manager.delete(SearchFile, { uuid: file.uuid });
    }
  }

  private async getDerivedProducts(queryRunner: QueryRunner, file: ModelFile | RegularFile): Promise<string[]> {
    const baseQuery =
      file instanceof ModelFile
        ? `SELECT "regularFileUuid" AS uuid
           FROM regular_file_source_model_files_model_file
           WHERE "modelFileUuid" = $1`
        : `SELECT "regularFileUuid_1" as uuid
           FROM regular_file_source_regular_files_regular_file
           WHERE "regularFileUuid_2" = $1`;
    const rows = await queryRunner.query(
      `WITH RECURSIVE traverse AS (
         ${baseQuery}
         UNION ALL
         SELECT "regularFileUuid_1" as uuid
         FROM regular_file_source_regular_files_regular_file
         JOIN traverse ON "regularFileUuid_2" = traverse.uuid
       )
       SELECT uuid FROM traverse`,
      [file.uuid],
    );
    return rows.map((row: any) => row.uuid);
  }
}

function addCommonFilters(qb: any, query: any) {
  qb.andWhere("site.id IN (:...site)", query);
  if (query.product) qb.andWhere("product.id IN (:...product)", query);
  if (query.dateFrom) qb.andWhere("file.measurementDate >= :dateFrom", query);
  if (query.dateTo) qb.andWhere("file.measurementDate <= :dateTo", query);
  if (query.volatile) qb.andWhere("file.volatile IN (:...volatile)", query);
  if (query.legacy) qb.andWhere("file.legacy IN (:...legacy)", query);
  return qb;
}

function isValidFilename(file: any) {
  const [date, site] = basename(file.s3key).split(".")[0].split("_");
  return file.measurementDate.replace(/-/g, "") == date && (file.site == site || typeof file.site == "object");
}
