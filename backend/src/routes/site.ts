import { Request, RequestHandler, Response } from "express";
import { Connection, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, toArray } from "../lib";
import { Site } from "../entity/Site";
import { SiteLocation } from "../entity/SiteLocation";
import { RegularFile } from "../entity/File";

export class SiteRoutes {
  constructor(conn: Connection) {
    this.conn = conn;
    this.siteRepo = conn.getRepository<Site>("site");
    this.regularFileRepo = conn.getRepository<RegularFile>("regular_file");
    this.siteLocationRepo = conn.getRepository<SiteLocation>("site_location");
  }

  readonly conn: Connection;
  readonly siteRepo: Repository<Site>;
  readonly regularFileRepo: Repository<RegularFile>;
  readonly siteLocationRepo: Repository<SiteLocation>;

  site: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteid", req.params);
    hideTestDataFromNormalUsers<Site>(qb, req)
      .getOne()
      .then((result) => {
        if (result == undefined) return next({ status: 404, errors: ["No sites match this id"] });
        res.send(result);
      })
      .catch((err) => next({ status: 500, errors: err }));
  };

  sites: RequestHandler = async (req: Request, res: Response, next) => {
    const query: any = req.query;
    const qb = this.siteRepo.createQueryBuilder("site");
    if (query.showCitations) qb.leftJoinAndSelect("site.citations", "citations");
    else qb.select();
    const statuses = await this.fetchStatuses();

    hideTestDataFromNormalUsers(qb, req)
      .addOrderBy("site.id", "ASC")
      .getMany()
      .then((sites) => {
        const typeQuery = toArray(query.type);
        if (typeQuery) sites = this.sitesContainAtLeastOneType(sites, typeQuery);
        res.send(
          sites.map((site) => ({
            ...site,
            status: statuses[site.id] || "inactive",
          }))
        );
      })
      .catch((err) => next({ status: 500, errors: err }));
  };

  private sitesContainAtLeastOneType(sites: Site[], typeQuery: Array<string>) {
    return sites.filter((site) => site.type.filter((type) => typeQuery.includes(type)).length > 0);
  }

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
      const location = await this.siteLocationRepo.findOne({ where: { site, date: req.params.date } });
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
      const locations = await this.siteLocationRepo.find({ where: { site }, order: { date: "ASC" } });
      res.send(locations);
    } catch (err: any) {
      return next({ status: 500, errors: err });
    }
  };
}
