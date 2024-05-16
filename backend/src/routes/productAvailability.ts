import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { SearchFile } from "../entity/SearchFile";
import { InstrumentUpload } from "../entity/Upload";

export class ProductAvailabilityRoutes {
  constructor(dataSource: DataSource) {
    this.searchFileRepo = dataSource.getRepository(SearchFile);
    this.uploadRepo = dataSource.getRepository(InstrumentUpload);
  }

  readonly searchFileRepo: Repository<SearchFile>;
  readonly uploadRepo: Repository<InstrumentUpload>;

  uploadAmount: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const { instrumentPid } = req.query;
      const rawData = await this.uploadRepo
        .createQueryBuilder("file")
        .select([
          'file."measurementDate"::date AS "date"',
          'COUNT(file."uuid") AS "fileCount"',
          'SUM(file."size") AS "totalSize"',
        ])
        .where("file.instrumentPid = :instrumentPid", { instrumentPid })
        .andWhere("file.status IN ('uploaded', 'processed')")
        .groupBy('file."measurementDate"')
        .orderBy('file."measurementDate"', "ASC")
        .getRawMany();
      res.send(rawData);
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };

  productAvailability: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const fileQb = this.searchFileRepo
        .createQueryBuilder("file")
        .select([
          "file.uuid AS uuid",
          'file."measurementDate"::text AS "measurementDate"',
          'file."productId" as "productId"',
          'file."errorLevel" AS "errorLevel"',
          "file.legacy AS legacy",
          "product.experimental AS experimental",
          'file."instrumentPid" AS "instrumentPid"',
          'file."siteId" AS "siteId"',
        ])
        .leftJoin("file.product", "product")
        .leftJoinAndSelect("file.instrumentInfo", "instrumentInfo")
        .orderBy("file.measurementDate", "DESC")
        .addOrderBy("file.productId", "ASC")
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
      const rawData = await fileQb.getRawMany();
      const data = rawData.map((data) => ({
        uuid: data.uuid,
        measurementDate: data.measurementDate,
        productId: data.productId,
        errorLevel: data.errorLevel,
        legacy: data.legacy,
        experimental: data.experimental,
        siteId: data.siteId,
        instrumentPid: data.instrumentPid,
        instrumentInfo: data.instrumentInfo_uuid
          ? {
              uuid: data.instrumentInfo_uuid,
              pid: data.instrumentInfo_pid,
              instrument: data.instrumentInfo_instrument,
              name: data.instrumentInfo_name,
              owners: data.instrumentInfo_owners,
              model: data.instrumentInfo_model,
              type: data.instrumentInfo_type,
              serialNumber: data.instrumentInfo_serialNumber,
            }
          : null,
      }));
      res.send(data);
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };
}
