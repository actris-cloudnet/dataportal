import { Request, RequestHandler, Response } from "express";
import { Connection, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, toArray } from "../lib";
import { Site } from "../entity/Site";
import { SiteLocation } from "../entity/SiteLocation";

export class SiteRoutes {
  constructor(conn: Connection) {
    this.conn = conn;
    this.siteRepo = conn.getRepository<Site>("site");
    this.siteLocationRepo = conn.getRepository<SiteLocation>("site_location");
  }

  readonly conn: Connection;
  readonly siteRepo: Repository<Site>;
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

    hideTestDataFromNormalUsers(qb, req)
      .addOrderBy("site.id", "ASC")
      .getMany()
      .then((result) => {
        const typeQuery = toArray(query.type);
        if (typeQuery) result = sitesContainAtLeastOneType(result, typeQuery);
        res.send(result);
      })
      .catch((err) => next({ status: 500, errors: err }));

    function sitesContainAtLeastOneType(result: Site[], typeQuery: Array<string>) {
      return result.filter((site) => site.type.filter((type) => typeQuery.includes(type)).length > 0);
    }
  };

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
      const locations = await this.siteLocationRepo.find({ where: { site }, order: { site: "ASC" } });
      res.send(locations);
    } catch (err: any) {
      return next({ status: 500, errors: err });
    }
  };
}
