import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, toArray } from "../lib";
import { Site } from "../entity/Site";
import { SiteLocation } from "../entity/SiteLocation";
import { RegularFile } from "../entity/File";

export class SiteRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.regularFileRepo = dataSource.getRepository(RegularFile);
    this.siteLocationRepo = dataSource.getRepository(SiteLocation);
  }

  readonly dataSource: DataSource;
  readonly siteRepo: Repository<Site>;
  readonly regularFileRepo: Repository<RegularFile>;
  readonly siteLocationRepo: Repository<SiteLocation>;

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
      const statuses = await this.fetchStatuses();
      res.send(
        sites.map((site) => ({
          ...site,
          status: statuses[site.id] || "inactive",
        })),
      );
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };

  private async fetchStatuses(): Promise<Record<string, string>> {
    const rows = await this.regularFileRepo
      .createQueryBuilder("file")
      .select("file.siteId")
      .addSelect("array_agg(distinct file.productId)", "latestProducts")
      .where("file.measurementDate > CURRENT_DATE - 7")
      .groupBy("file.siteId")
      .getRawMany();

    return rows.reduce((obj, item) => {
      obj[item.siteId] = this.getStatus(item.latestProducts);
      return obj;
    }, {});
  }

  private getStatus(products: string[]) {
    if (products.includes("classification")) {
      return "cloudnet";
    }
    if (products.length > 0) {
      return "active";
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
}
