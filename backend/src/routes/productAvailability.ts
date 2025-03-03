import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { SearchFile } from "../entity/SearchFile";
import { InstrumentUpload } from "../entity/Upload";
import { ModelFile } from "../entity/File";

export class ProductAvailabilityRoutes {
  constructor(dataSource: DataSource) {
    this.searchFileRepo = dataSource.getRepository(SearchFile);
    this.uploadRepo = dataSource.getRepository(InstrumentUpload);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
  }

  readonly searchFileRepo: Repository<SearchFile>;
  readonly uploadRepo: Repository<InstrumentUpload>;
  readonly modelFileRepo: Repository<ModelFile>;

  uploadAmount: RequestHandler = async (req, res) => {
    const { instrumentPid } = req.query;
    const rawData = await this.uploadRepo
      .createQueryBuilder("file")
      .select([
        'file."measurementDate"::text AS "date"',
        'COUNT(file."uuid") AS "fileCount"',
        'SUM(file."size") AS "totalSize"',
      ])
      .where("file.instrumentPid = :instrumentPid", { instrumentPid })
      .andWhere("file.status IN ('uploaded', 'processed')")
      .groupBy('file."measurementDate"')
      .orderBy('file."measurementDate"', "ASC")
      .getRawMany();
    const data = rawData.map((row) => ({
      date: row.date,
      fileCount: parseInt(row.fileCount),
      totalSize: parseInt(row.totalSize),
    }));
    res.send(data);
  };

  productAvailability: RequestHandler = async (req, res) => {
    // Search files (excluding model files)
    const fileQb = this.searchFileRepo
      .createQueryBuilder("file")
      .where("file.productId != 'model'")
      .select([
        "file.uuid AS uuid",
        'file."measurementDate"::text AS "measurementDate"',
        'file."productId" AS "productId"',
        'file."errorLevel" AS "errorLevel"',
        "file.legacy AS legacy",
        "product.experimental AS experimental",
        'file."siteId" AS "siteId"',
      ])
      .leftJoin("file.product", "product")
      .leftJoinAndSelect("file.instrumentInfo", "instrumentInfo")
      .addOrderBy("file.errorLevel", "ASC");
    if ("site" in req.query) {
      fileQb.andWhere("file.siteId = :siteId", { siteId: req.query.site });
    }
    if ("instrumentPid" in req.query) {
      fileQb.andWhere("file.instrumentPid = :instrumentPid", { instrumentPid: req.query.instrumentPid });
    }
    if (!("includeExperimental" in req.query)) {
      fileQb.andWhere("product.experimental = false");
    }
    if ("model" in req.query && !("instrumentPid" in req.query)) {
      fileQb.andWhere("1=0");
    }

    // ALL model files
    const modelFileQb = this.modelFileRepo
      .createQueryBuilder("model_file")
      .select([
        "model_file.uuid AS uuid",
        'model_file."measurementDate"::text AS "measurementDate"',
        'model_file."productId" AS "productId"',
        'model_file."errorLevel" AS "errorLevel"',
        'model_file."modelId" AS "modelId"',
        "model_file.legacy AS legacy",
        'model_file."siteId" AS "siteId"',
        "false AS experimental", // model files are never experimental
        'model."humanReadableName" AS "modelName"',
      ])
      .leftJoin("model_file.model", "model")
      .addOrderBy("model_file.errorLevel", "ASC");
    if ("site" in req.query) {
      modelFileQb.andWhere("model_file.siteId = :siteId", { siteId: req.query.site });
    }
    if ("model" in req.query) {
      modelFileQb.andWhere("model_file.modelId = :model", { model: req.query.model });
    }
    if ("instrumentPid" in req.query && !("model" in req.query)) {
      modelFileQb.andWhere("1=0");
    }

    const [rawData, rawModelData] = await Promise.all([fileQb.getRawMany(), modelFileQb.getRawMany()]);

    const combinedData = [...rawData, ...rawModelData].map((data) => ({
      uuid: data.uuid,
      measurementDate: data.measurementDate,
      productId: data.productId,
      legacy: data.legacy,
      siteId: data.siteId,
      experimental: data.experimental,
      errorLevel: data.errorLevel,
      instrumentInfo: data.instrumentInfo_uuid
        ? {
            pid: data.instrumentInfo_pid,
            name: data.instrumentInfo_name,
          }
        : null,
      modelInfo: data.modelId
        ? {
            id: data.modelId,
            humanReadableName: data.modelName,
          }
        : null,
    }));

    res.send(combinedData);
  };
}
