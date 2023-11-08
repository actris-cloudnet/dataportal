import { Request, RequestHandler, Response } from "express";
import { Collection } from "../entity/Collection";
import { EntityManager, Repository, SelectQueryBuilder, In, DataSource, ObjectLiteral, Raw } from "typeorm";
import { isFile, RegularFile } from "../entity/File";
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
  readonly softwareService: SoftwareService;

  file: RequestHandler = async (req: Request, res: Response, next) => {
    const getFileByUuid = (repo: Repository<RegularFile | ModelFile>, isModel: boolean | undefined) => {
      const qb = repo
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.product", "product")
        .leftJoinAndSelect("file.software", "software")
        .orderBy('COALESCE(software."humanReadableName", software.code)', "ASC");
      const prop = isModel ? "model" : "instrument";
      qb.leftJoinAndSelect(`file.${prop}`, prop);
      qb.where("file.uuid = :uuid", req.params);
      return hideTestDataFromNormalUsers<RegularFile | ModelFile>(qb, req).getOne();
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
    const getFileByUuid = (repo: Repository<RegularFile | ModelFile>, _isModel: boolean | undefined) =>
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
      const stream = await this.searchFilesQueryBuilder(query).stream();
      streamHandler(stream, res, "file", converterFunction);
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

    try {
      const sourceFileIds = req.body.sourceFileIds || [];
      await Promise.all(
        sourceFileIds.map(
          async (uuid: string) => (await this.findAnyFile((repo) => repo.findOneBy({ uuid }))) || Promise.reject(),
        ),
      );
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
      } else if (existingFile.site.isTestSite || existingFile.volatile) {
        // Replace existing
        file.createdAt = existingFile.createdAt;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.save(FileClass, file);
          await transactionalEntityManager.update(SearchFile, { uuid: file.uuid }, searchFile);
        });
        res.sendStatus(200);
      } else if (existingFile.uuid != file.uuid) {
        // New version
        if (isModel) return next({ status: 501, errors: ["Versioning is not supported for model files."] });
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
      const existingFile = await this.findAnyFile((repo) =>
        repo.findOne({ where: { uuid: partialFile.uuid }, relations: { product: true } }),
      );
      if (!existingFile) return next({ status: 422, errors: ["No file matches the provided uuid"] });
      let repo: Repository<RegularFile | ModelFile> = this.fileRepo;
      if (existingFile.product.id == "model") repo = this.modelFileRepo;
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
    // TODO: use transaction
    const query: any = req.query;
    const dryRun = query.dryRun;
    const uuid = req.params.uuid;
    const filenames: string[] = [];
    try {
      const existingFile = await this.findAnyFile((repo) =>
        repo.findOne({ where: { uuid }, relations: { product: true, site: true } }),
      );
      if (!existingFile) return next({ status: 422, errors: ["No file matches the provided uuid"] });
      if (!existingFile.volatile) return next({ status: 422, errors: ["Forbidden to delete a stable file"] });
      let fileRepo: Repository<RegularFile | ModelFile> = this.fileRepo;
      let visuRepo: Repository<Visualization | ModelVisualization> = this.visualizationRepo;
      if (existingFile.product.id == "model") {
        fileRepo = this.modelFileRepo;
        visuRepo = this.modelVisualizationRepo;
      }
      const higherLevelProductNames = await this.getHigherLevelProducts(existingFile.product);
      const products = await this.fileRepo.findBy({
        site: { id: existingFile.site.id },
        measurementDate: existingFile.measurementDate,
        product: In(higherLevelProductNames),
      });
      if (query.deleteHigherProducts && products.length > 0) {
        const onlyVolatileProducts = products.every((product) => product.volatile);
        if (!onlyVolatileProducts)
          return next({ status: 422, errors: ["Forbidden to delete due to higher level stable files"] });
        for (const product of products) {
          filenames.push(
            ...(await this.deleteFileAndVisualizations(this.fileRepo, this.visualizationRepo, product.uuid, dryRun)),
          );
        }
      }
      filenames.push(...(await this.deleteFileAndVisualizations(fileRepo, visuRepo, uuid, dryRun)));
      res.send(filenames);
    } catch (e) {
      return next({ status: 500, errors: e });
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
    let repo: Repository<RegularFile | ModelFile> = this.fileRepo;
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
    if (isModel && query.instrument) qb.andWhere("1 = 0");

    if (query.filename) qb.andWhere("regexp_replace(s3key, '.+/', '') IN (:...filename)", query); // eslint-disable-line quotes
    if (query.releasedBefore) qb.andWhere("file.updatedAt < :releasedBefore", query);
    if (query.updatedAtFrom) qb.andWhere("file.updatedAt >= :updatedAtFrom", query);
    if (query.updatedAtTo) qb.andWhere("file.updatedAt <= :updatedAtTo", query);
    if (query.instrumentPid) qb.andWhere("file.instrumentPid IN (:...instrumentPid)", query);
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

  public async findAnyFile(
    searchFunc: (arg0: Repository<RegularFile | ModelFile>, arg1?: boolean) => Promise<RegularFile | ModelFile | null>,
  ): Promise<RegularFile | ModelFile | null> {
    const [file, modelFile] = await Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true),
    ]);
    return file || modelFile;
  }

  async findAllFiles(
    searchFunc: (arg0: Repository<RegularFile | ModelFile>, arg1?: boolean) => Promise<(RegularFile | ModelFile)[]>,
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

  private async deleteFileAndVisualizations(
    fileRepo: Repository<RegularFile | ModelFile>,
    visualizationRepo: Repository<Visualization | ModelVisualization>,
    uuid: string,
    dryRun: boolean,
  ) {
    const filenames: string[] = [];
    const file = await fileRepo.findOneByOrFail({ uuid });
    filenames.push(file.s3key);
    const images = await visualizationRepo.findBy({ sourceFile: { uuid } });
    for (const image of images) filenames.push(image.s3key);
    if (!dryRun) {
      await visualizationRepo.delete({ sourceFile: { uuid } });
      await fileRepo.delete({ uuid });
      await this.searchFileRepo.delete({ uuid });
      await this.fileQualityRepo.delete({ uuid });
    }
    return filenames;
  }

  private async getHigherLevelProducts(product: Product): Promise<string[]> {
    // Returns Cloudnet products that are of higher level than the given product.
    let uniqueLevels = await this.productRepo
      .createQueryBuilder()
      .select("DISTINCT level")
      .orderBy("level")
      .getRawMany();
    uniqueLevels = uniqueLevels.map((level) => level.level);
    const index = uniqueLevels.indexOf(product.level);
    const levels = uniqueLevels.slice(index + 1);
    const products = await this.productRepo
      .createQueryBuilder()
      .where({ level: In(levels) })
      .select("id")
      .getRawMany();
    return products.map((prod) => prod.id);
  }
}

function addCommonFilters<Entity extends ObjectLiteral>(qb: SelectQueryBuilder<Entity>, query: any) {
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
