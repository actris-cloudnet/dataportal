import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, toArray } from "../lib";
import { Site, SiteType } from "../entity/Site";
import { SiteLocation } from "../entity/SiteLocation";
import { ModelFile, RegularFile } from "../entity/File";
import { SearchFile } from "../entity/SearchFile";
import axios from "axios";
import env from "../lib/env";

export class SiteRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.regularFileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.siteLocationRepo = dataSource.getRepository(SiteLocation);
    this.searchFileRepo = dataSource.getRepository(SearchFile);
    this.dvasCache = {};
    this.actrisCache = {};
  }

  readonly dataSource: DataSource;
  readonly siteRepo: Repository<Site>;
  readonly regularFileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly siteLocationRepo: Repository<SiteLocation>;
  readonly searchFileRepo: Repository<SearchFile>;
  readonly dvasCache: Record<string, any>;
  readonly actrisCache: Record<string, any>;

  site: RequestHandler = async (req, res, next) => {
    const qb = this.siteRepo
      .createQueryBuilder("site")
      .leftJoinAndSelect("site.persons", "person")
      .where("site.id = :siteId", req.params);
    const site = await hideTestDataFromNormalUsers(qb, req).getOne();
    if (!site) {
      return next({ status: 404, errors: ["No sites match this id"] });
    }
    res.send({
      ...site,
      _actris: site.actrisId ? await this.fetchActrisFacility(site.actrisId) : null,
      _dvas: site.dvasId ? await this.fetchDvasFacility(site.dvasId) : null,
    });
  };

  sites: RequestHandler = async (req, res) => {
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
      sites.map((site: any) => ({
        ...site,
        status: (site.type.includes(SiteType.MODEL) ? modelStatuses[site.id] : cloudnetStatuses[site.id]) || "inactive",
      })),
    );
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
    const qb = this.siteRepo.createQueryBuilder("site").where("site.id = :siteId", req.params);
    const site = await hideTestDataFromNormalUsers(qb, req).getOne();
    if (!site) return next({ status: 404, errors: ["No sites match this id"] });
    let where = `"siteId"=$1`;
    const params = [site.id];
    if (req.query.date) {
      where += " AND date::date = $2";
      params.push(req.query.date);
    }
    const query = req.query.raw
      ? `SELECT to_char(date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS date,
                latitude,
                longitude
         FROM site_location
         WHERE ${where}
         ORDER BY date`
      : `SELECT date,
                round(degrees(atan2(z, sqrt(x * x + y * y)))::numeric, 3)::float AS latitude,
                round(degrees(atan2(y, x))::numeric, 3)::float AS longitude
         FROM (SELECT date::date::text,
                      avg(cos(radians(latitude)) * cos(radians(longitude))) AS x,
                      avg(cos(radians(latitude)) * sin(radians(longitude))) AS y,
                      avg(sin(radians(latitude))) AS z
               FROM site_location
               WHERE ${where}
               GROUP BY date::date
               ORDER BY date::date)`;
    const locations = await this.siteLocationRepo.query(query, params);
    if (req.query.date && !req.query.raw) {
      if (locations.length !== 1) {
        return next({ status: 404, errors: ["No location match this date"] });
      }
      res.send(locations[0]);
    } else {
      res.send(locations);
    }
  };

  private async fetchDvasFacility(dvasId: string) {
    const cached = this.dvasCache[dvasId];
    if (cached) return cached;
    try {
      const res = await axios.get(`${env.DVAS_URL}/facilities/${dvasId}`);
      const obj = res.data[0];
      const result = {
        id: obj.identifier,
        name: obj.name,
        uri: `${env.DC_URL}/facility/${obj.identifier}`,
      };
      this.dvasCache[dvasId] = result;
      return result;
    } catch (err) {
      console.error("Failed to fetch DVAS facility", err);
      return null;
    }
  }

  private async fetchActrisFacility(actrisId: number) {
    const cached = this.actrisCache[actrisId];
    if (cached) return cached;
    try {
      const res = await axios.get(`${env.LABELLING_URL}/api/facilities/${actrisId}`);
      const obj = res.data;
      const result = {
        id: obj.id,
        name: obj.name,
        uri: obj.landing_page,
      };
      this.actrisCache[actrisId] = result;
      return result;
    } catch (err) {
      console.error("Failed to fetch ACTRIS facility", err);
      return null;
    }
  }
}
