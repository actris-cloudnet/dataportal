import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, toArray } from "../lib";
import { Site, SiteType } from "../entity/Site";
import { SiteLocation } from "../entity/SiteLocation";
import { ModelFile, RegularFile } from "../entity/File";
import { SearchFile } from "../entity/SearchFile";

export class SiteRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.regularFileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.siteLocationRepo = dataSource.getRepository(SiteLocation);
    this.searchFileRepo = dataSource.getRepository(SearchFile);
  }

  readonly dataSource: DataSource;
  readonly siteRepo: Repository<Site>;
  readonly regularFileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly siteLocationRepo: Repository<SiteLocation>;
  readonly searchFileRepo: Repository<SearchFile>;

  site: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const qb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteid", req.params);
      const site = await hideTestDataFromNormalUsers<Site>(qb, req).getOne();
      if (!site) {
        return next({ status: 404, errors: ["No sites match this id"] });
      }
      res.send(site);
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };

  sites: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const query: any = req.query;
      const qb = this.siteRepo.createQueryBuilder("site");
      if (query.showCitations) {
        qb.leftJoinAndSelect("site.citations", "citations");
      }
      if (query.type) {
        qb.where("site.type && :types", { types: toArray(query.type) });
      }
      const sites = await hideTestDataFromNormalUsers(qb, req).addOrderBy("site.id", "ASC").getMany();
      const cloudnetStatuses = await this.queryCloudnetStatuses();
      const modelStatuses = await this.queryModelStatuses();
      res.send(
        sites.map((site) => ({
          ...site,
          status:
            (site.type.includes(SiteType.MODEL) ? modelStatuses[site.id] : cloudnetStatuses[site.id]) || "inactive",
        })),
      );
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };

  private async queryCloudnetStatuses(): Promise<Record<string, string>> {
    const rows = await this.regularFileRepo
      .createQueryBuilder("file")
      .select("file.siteId")
      .addSelect("array_agg(distinct file.productId)", "latestProducts")
      .where("file.measurementDate > CURRENT_DATE - 7")
      .groupBy("file.siteId")
      .getRawMany();

    return rows.reduce((obj, item) => {
      obj[item.siteId] = this.getCloudnetStatus(item.latestProducts);
      return obj;
    }, {});
  }

  private getCloudnetStatus(products: string[]) {
    if (products.includes("classification")) {
      return "cloudnet";
    }
    if (products.length > 0) {
      return "active";
    }
    return "inactive";
  }

  private async queryModelStatuses(): Promise<Record<string, string>> {
    const rows = await this.modelFileRepo
      .createQueryBuilder("file")
      .select("file.siteId")
      .addSelect("array_agg(distinct file.productId)", "latestProducts")
      .where("file.measurementDate > CURRENT_DATE - 3")
      .groupBy("file.siteId")
      .getRawMany();

    return rows.reduce((obj, item) => {
      obj[item.siteId] = this.getModelStatus(item.latestProducts);
      return obj;
    }, {});
  }

  private getModelStatus(products: string[]) {
    if (products.includes("model")) {
      return "cloudnet";
    }
    return "inactive";
  }

  location: RequestHandler = async (req, res, next) => {
    try {
      const qb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteid", req.params);
      const site = await hideTestDataFromNormalUsers<Site>(qb, req).getOne();
      if (!site) return next({ status: 404, errors: ["No sites match this id"] });
      const location = await this.siteLocationRepo.findOneBy({ siteId: site.id, date: new Date(req.params.date) });
      if (!location) return next({ status: 404, errors: ["No location match this date"] });
      res.send(location);
    } catch (err: any) {
      return next({ status: 500, errors: err });
    }
  };

  locations: RequestHandler = async (req, res, next) => {
    try {
      const qb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteid", req.params);
      const site = await hideTestDataFromNormalUsers<Site>(qb, req).getOne();
      if (!site) return next({ status: 404, errors: ["No sites match this id"] });
      const locations = await this.siteLocationRepo.find({ where: { siteId: site.id }, order: { date: "ASC" } });
      res.send(locations);
    } catch (err: any) {
      return next({ status: 500, errors: err });
    }
  };

  productAvailability: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const siteQb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteid", req.params);
      const site = await hideTestDataFromNormalUsers<Site>(siteQb, req).getExists();
      if (!site) {
        return next({ status: 404, errors: ["No sites match this id"] });
      }
      const fileQb = this.searchFileRepo
        .createQueryBuilder("file")
        .select([
          "file.uuid AS uuid",
          'file."measurementDate"::text AS "measurementDate"',
          'file."productId" as "productId"',
          'file."errorLevel" AS "errorLevel"',
          "file.legacy AS legacy",
        ])
        .distinctOn(['file."measurementDate"', "file.productId", "file.errorLevel"])
        .leftJoin("file.product", "product")
        .where("file.siteId = :siteId", { siteId: req.params.siteid })
        .orderBy("file.measurementDate", "DESC")
        .addOrderBy("file.productId", "ASC")
        .addOrderBy("file.errorLevel", "ASC");
      if (!("includeExperimental" in req.query)) {
        fileQb.andWhere("product.experimental = false");
      }
      res.send(await fileQb.getRawMany());
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };
}
