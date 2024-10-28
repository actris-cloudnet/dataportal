import { Request, RequestHandler, Response, NextFunction } from "express";

import { DataSource } from "typeorm";
import { isValidDate } from "../lib";
import env from "../lib/env";
import axios from "axios";
import { DownloadStats } from "../entity/Download";
import { Site } from "../entity/Site";

export class StatisticsRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  readonly dataSource: DataSource;

  getStatistics: RequestHandler = async (req, res, next) => {
    try {
      switch (req.query.dimensions) {
        case "yearMonth,downloads":
        case "year,downloads":
        case "yearMonth,uniqueIps":
        case "year,uniqueIps":
        case "country,downloads":
          return this.downloadStats(req, res, next);
        case "yearMonth,curatedData":
        case "year,curatedData":
          return this.curatedDataStats(req, res, next);
        case "yearMonth,visits":
          return this.matomoStats(req, res, next, this.visitsByPeriod.bind(this, "month"));
        case "year,visits":
          return this.matomoStats(req, res, next, this.visitsByPeriod.bind(this, "year"));
        case "country,visits":
          return this.matomoStats(req, res, next, this.visitsByCountry.bind(this));
        default:
          return next({ status: 400, errors: "invalid dimensions" });
      }
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  downloadStats: RequestHandler = async (req, res, next) => {
    const qb = this.dataSource.manager.createQueryBuilder(DownloadStats, "stats");

    if (typeof req.query.productTypes === "string") {
      const productTypes = req.query.productTypes.split(",");
      if (!productTypes.every((type) => ["observation", "model", "fundamentalParameter"].includes(type))) {
        return next({ status: 400, errors: "invalid productType" });
      }
      qb.andWhere('"productType" IN (:...productTypes)', { productTypes });
    }
    if (req.query.downloadDateFrom) {
      if (typeof req.query.downloadDateFrom !== "string" || !isValidDate(req.query.downloadDateFrom)) {
        return next({ status: 400, errors: "invalid downloadDateFrom" });
      }
      qb.andWhere('"downloadDate" >= :downloadDateFrom', { downloadDateFrom: new Date(req.query.downloadDateFrom) });
    }
    if (req.query.downloadDateTo) {
      if (typeof req.query.downloadDateTo !== "string" || !isValidDate(req.query.downloadDateTo)) {
        return next({ status: 400, errors: "invalid downloadDateTo" });
      }
      qb.andWhere('"downloadDate" <= :downloadDateTo', { downloadDateTo: new Date(req.query.downloadDateTo) });
    }
    if (req.query.measurementDateFrom) {
      if (typeof req.query.measurementDateFrom !== "string" || !isValidDate(req.query.measurementDateFrom)) {
        return next({ status: 400, errors: "invalid measurementDateFrom" });
      }
      qb.andWhere('"measurementDate" >= :measurementDateFrom', {
        measurementDateFrom: new Date(req.query.measurementDateFrom),
      });
    }
    if (req.query.measurementDateTo) {
      if (typeof req.query.measurementDateTo !== "string" || !isValidDate(req.query.measurementDateTo)) {
        return next({ status: 400, errors: "invalid measurementDateTo" });
      }
      qb.andWhere('"measurementDate" <= :measurementDateTo', {
        measurementDateTo: new Date(req.query.measurementDateTo),
      });
    }
    if (req.query.site && req.query.country) {
      return next({ status: 400, errors: "site and country parameters cannot be used at the same time" });
    }
    if (req.query.site) {
      qb.andWhere('"siteId" = :site', { site: req.query.site });
    }
    if (typeof req.query.country === "string") {
      const sites = await this.dataSource.manager.find(Site, {
        select: { id: true },
        where: { countryCode: req.query.country },
      });
      qb.andWhere('"siteId" IN (:...siteIds)', { siteIds: sites.map((site) => site.id) });
    }

    if (req.query.dimensions === "yearMonth,downloads") {
      qb.select("to_char(\"downloadDate\", 'YYYY-MM')", "yearMonth")
        .addSelect("SUM(downloads) / 300", "downloads")
        .groupBy('"yearMonth"')
        .orderBy('"yearMonth"');
    } else if (req.query.dimensions === "year,downloads") {
      qb.select("to_char(\"downloadDate\", 'YYYY')", "year")
        .addSelect("SUM(downloads) / 300", "downloads")
        .groupBy("year")
        .orderBy("year");
    } else if (req.query.dimensions === "yearMonth,uniqueIps") {
      qb.select("to_char(\"downloadDate\", 'YYYY-MM')", "yearMonth")
        .addSelect("COUNT(DISTINCT ip)", "uniqueIps")
        .groupBy('"yearMonth"')
        .orderBy('"yearMonth"');
    } else if (req.query.dimensions === "year,uniqueIps") {
      qb.select("to_char(\"downloadDate\", 'YYYY')", "year")
        .addSelect("COUNT(DISTINCT ip)", "uniqueIps")
        .groupBy("year")
        .orderBy("year");
    } else if (req.query.dimensions === "country,downloads") {
      qb.select("country").addSelect("SUM(downloads) / 300", "downloads").groupBy("country").orderBy("country");
    }

    const rows = await qb.getRawMany();
    rows.forEach((row: any) => {
      if (row.downloads) row.downloads = parseFloat(row.downloads);
      if (row.uniqueIps) row.uniqueIps = parseInt(row.uniqueIps);
    });
    res.send(rows);
  };

  curatedDataStats: RequestHandler = async (req, res, next) => {
    const params = [];

    let select, group, order;
    if (req.query.dimensions === "yearMonth,curatedData") {
      select = `SELECT to_char("measurementDate", 'YYYY-MM') AS "yearMonth"
                     , SUM("variableDays") / 300.0 AS "curatedData"`;
      group = 'GROUP BY "yearMonth"';
      order = 'ORDER BY "yearMonth"';
    } else {
      select = `SELECT to_char("measurementDate", 'YYYY') AS year
                     , SUM("variableDays") / 300.0 AS "curatedData"`;
      group = "GROUP BY year";
      order = "ORDER BY year";
    }

    const productTypes = typeof req.query.productTypes === "string" ? req.query.productTypes.split(",") : [];
    if (!productTypes.every((type) => ["observation", "model", "fundamentalParameter"].includes(type))) {
      return next({ status: 400, errors: "invalid productType" });
    }
    if (productTypes.length === 0 || (productTypes.length === 1 && productTypes[0] === "fundamentalParameter")) {
      res.send([]);
      return;
    }

    if (req.query.downloadDateFrom) {
      return next({ status: 400, errors: "curatedData dimension doesn't support downloadDateFrom parameter" });
    }
    if (req.query.downloadDateTo) {
      return next({ status: 400, errors: "curatedData dimension doesn't support downloadDateTo parameter" });
    }

    const productFileJoin = 'JOIN product_variable USING ("productId")';
    const productFileWhere = 'WHERE product_variable."actrisName" IS NOT NULL';
    let fileJoin = "";
    let fileWhere = "";
    if (req.query.site && req.query.country) {
      return next({ status: 400, errors: "site and country parameters cannot be used at the same time" });
    }
    if (req.query.site) {
      params.push(req.query.site);
      fileWhere = `AND "siteId" = $${params.length}`;
    }
    if (req.query.country) {
      params.push(req.query.country);
      fileJoin = 'JOIN site ON "siteId" = site.id';
      fileWhere = `AND "countryCode" = $${params.length}`;
    }

    if (productTypes.includes("observation") && !productTypes.includes("model")) {
      fileWhere += " AND \"productId\" != 'model'";
    } else if (productTypes.includes("model") && !productTypes.includes("observation")) {
      fileWhere += " AND \"productId\" = 'model'";
    }

    if (req.query.measurementDateFrom) {
      if (typeof req.query.measurementDateFrom !== "string" || !isValidDate(req.query.measurementDateFrom)) {
        return next({ status: 400, errors: "invalid measurementDateFrom" });
      }
      params.push(req.query.measurementDateFrom);
      fileWhere += ` AND "measurementDate" >= $${params.length}::date`;
    }
    if (req.query.measurementDateTo) {
      if (typeof req.query.measurementDateTo !== "string" || !isValidDate(req.query.measurementDateTo)) {
        return next({ status: 400, errors: "invalid measurementDateTo" });
      }
      params.push(req.query.measurementDateTo);
      fileWhere += ` AND "measurementDate" <= $${params.length}::date`;
    }

    const fileSelect = `SELECT "measurementDate", 1.0 AS "variableDays"
      FROM search_file AS file
      ${productFileJoin} ${fileJoin}
      ${productFileWhere} ${fileWhere}`;

    const query = `${select} FROM (${fileSelect}) file ${group} ${order}`;

    const rows = await this.dataSource.query(query, params);
    rows.forEach((row: any) => {
      row.curatedData = parseFloat(row.curatedData);
    });
    res.send(rows);
  };

  private async matomoStats(
    req: Request,
    res: Response,
    next: NextFunction,
    getData: (startDate?: string, endDate?: string) => Promise<any>,
  ) {
    if (req.query.downloadDateFrom) {
      if (typeof req.query.downloadDateFrom !== "string" || !isValidDate(req.query.downloadDateFrom)) {
        return next({ status: 400, errors: "invalid downloadDateFrom" });
      }
    }
    if (req.query.downloadDateTo) {
      if (typeof req.query.downloadDateTo !== "string" || !isValidDate(req.query.downloadDateTo)) {
        return next({ status: 400, errors: "invalid downloadDateTo" });
      }
    }
    res.send(await getData(req.query.downloadDateFrom, req.query.downloadDateTo));
  }

  private async visitsByPeriod(period: "year" | "month", startDate?: string, endDate?: string) {
    const data = await this.makeMatomoRequest({ method: "API.get", columns: "nb_visits", period }, startDate, endDate);
    const timeKey = period === "year" ? "year" : "yearMonth";
    return Object.entries(data).map(([time, visits]) => ({ [timeKey]: time, visits }));
  }

  private async visitsByCountry(startDate?: string, endDate?: string) {
    const data = await this.makeMatomoRequest(
      { method: "UserCountry.getCountry", period: "range" },
      startDate,
      endDate,
    );
    return data.map((item: any) => ({
      country: item.code !== "xx" ? item.code.toUpperCase() : null,
      visits: item.nb_visits,
    }));
  }

  private async makeMatomoRequest(params: Record<string, string>, startDate?: string, endDate?: string): Promise<any> {
    if (typeof env.MATOMO_HOST == "undefined") {
      throw new Error("Matomo not configured");
    }
    const res = await axios.post(
      env.MATOMO_HOST,
      { token_auth: env.MATOMO_TOKEN },
      {
        params: {
          ...params,
          module: "API",
          idSite: env.MATOMO_SITE_ID,
          date: [
            typeof startDate !== "undefined" ? startDate : env.MATOMO_START_DATE,
            typeof endDate !== "undefined" ? endDate : "today",
          ].join(","),
          format: "json",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    if (res.data.result === "error") {
      throw new Error(`Error from Matomo: ${res.data.message}`);
    }
    return res.data;
  }
}
