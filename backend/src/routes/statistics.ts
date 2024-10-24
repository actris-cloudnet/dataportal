import { Request, RequestHandler, Response, NextFunction } from "express";

import { DataSource } from "typeorm";
import { isValidDate } from "../lib";
import env from "../lib/env";
import axios from "axios";

enum ProductType {
  Observation = "observation",
  Model = "model",
  FundamentalParameter = "fundamentalParameter",
}

const allProductTypes = Object.values(ProductType) as ProductType[];

function productTypeFromString(value: string): ProductType | undefined {
  return (Object.values(ProductType) as string[]).includes(value) ? (value as ProductType) : undefined;
}

export class StatisticsRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  readonly dataSource: DataSource;

  getStatistics: RequestHandler = async (req, res, next) => {
    const params = [];
    let select,
      group,
      order,
      where = "";
    switch (req.query.dimensions) {
      case "yearMonth,downloads":
        select = `SELECT to_char(download."createdAt", 'YYYY-MM') AS "yearMonth"
                       , SUM("variableDays") / 300 AS downloads`;
        group = 'GROUP BY "yearMonth"';
        order = 'ORDER BY "yearMonth"';
        break;
      case "yearMonth,uniqueIps":
        select = `SELECT to_char(download."createdAt", 'YYYY-MM') AS "yearMonth"
                       , COUNT(DISTINCT ip) AS "uniqueIps"`;
        group = 'GROUP BY "yearMonth"';
        order = 'ORDER BY "yearMonth"';
        break;
      case "year,uniqueIps":
        select = `SELECT to_char(download."createdAt", 'YYYY') AS year
                       , COUNT(DISTINCT ip) AS "uniqueIps"`;
        group = "GROUP BY year";
        order = "ORDER BY year";
        break;
      case "country,downloads":
        select = 'SELECT country, SUM("variableDays") / 300 AS downloads';
        group = "GROUP BY country";
        order = "ORDER BY country";
        break;
      case "yearMonth,visits":
        return this.matomoStats(req, res, next, this.monthlyVisits.bind(this));
      case "country,visits":
        return this.matomoStats(req, res, next, this.visitsByCountry.bind(this));
      default:
        return next({ status: 400, errors: "invalid dimensions" });
    }

    let productTypes: Set<ProductType>;
    if (typeof req.query.productTypes === "undefined") {
      productTypes = new Set(allProductTypes);
    } else {
      if (typeof req.query.productTypes !== "string") {
        return next({ status: 400, errors: "invalid products parameter" });
      }
      productTypes = new Set();
      for (const productString of req.query.productTypes.split(",")) {
        const product = productTypeFromString(productString);
        if (!product) {
          return next({ status: 400, errors: `invalid product: ${productString}` });
        }
        productTypes.add(product);
      }
    }
    if (productTypes.size === 0) {
      return next({ status: 400, errors: "invalid products parameter" });
    }
    if (productTypes.size === 1 && productTypes.has(ProductType.FundamentalParameter)) {
      res.send([]);
      return;
    }

    if (req.query.downloadDateFrom) {
      if (typeof req.query.downloadDateFrom !== "string" || !isValidDate(req.query.downloadDateFrom)) {
        return next({ status: 400, errors: "invalid downloadDateFrom" });
      }
      params.push(req.query.downloadDateFrom);
      where += ` AND "createdAt" >= $${params.length}::date`;
    }
    if (req.query.downloadDateTo) {
      if (typeof req.query.downloadDateTo !== "string" || !isValidDate(req.query.downloadDateTo)) {
        return next({ status: 400, errors: "invalid downloadDateTo" });
      }
      params.push(req.query.downloadDateTo);
      where += ` AND "createdAt" < ($${params.length}::date + '1 day'::interval)`;
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
    const fileSelects = [];
    const collectionFileSelects = [];

    if (productTypes.has(ProductType.Observation)) {
      fileSelects.push(`SELECT uuid
        FROM regular_file
        ${productFileJoin} ${fileJoin}
        ${productFileWhere} ${fileWhere}`);
      collectionFileSelects.push(`SELECT "collectionUuid", "regularFileUuid" AS "fileUuid"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        ${productFileJoin} ${fileJoin}
        ${productFileWhere} ${fileWhere}`);
    }

    if (productTypes.has(ProductType.Model)) {
      fileSelects.push(`SELECT uuid
        FROM model_file
        ${productFileJoin} ${fileJoin}
        ${productFileWhere} ${fileWhere}`);
      collectionFileSelects.push(`SELECT "collectionUuid", "modelFileUuid" AS "fileUuid"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
        ${productFileJoin} ${fileJoin}
        ${productFileWhere} ${fileWhere}`);
    }

    const fileSelect = `SELECT uuid, count(*) AS "variableDays"
       FROM (${fileSelects.join(" UNION ALL ")}) AS file
       GROUP BY uuid
       UNION ALL
       SELECT "collectionUuid" AS uuid, COUNT(*) AS "variableDays"
       FROM (${collectionFileSelects.join(" UNION ALL ")}) AS collection_file
       GROUP BY "collectionUuid"`;

    const query = `${select}
      FROM download
      JOIN (${fileSelect}) object ON "objectUuid" = object.uuid
      WHERE ip NOT IN ('', '::ffff:127.0.0.1') AND ip NOT LIKE '192.168.%' AND ip NOT LIKE '193.166.223.%'
      ${where}
      ${group}
      ${order}`;

    try {
      const rows = await this.dataSource.query(query, params);
      rows.forEach((row: any) => {
        if (row.downloads) row.downloads = parseFloat(row.downloads);
        if (row.uniqueIps) row.uniqueIps = parseInt(row.uniqueIps);
      });
      res.send(rows);
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  private matomoStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
    getData: (startDate?: string, endDate?: string) => Promise<any>,
  ) => {
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
    try {
      res.send(await getData(req.query.downloadDateFrom, req.query.downloadDateTo));
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  private async monthlyVisits(startDate?: string, endDate?: string) {
    const data = await this.makeMatomoRequest(
      { method: "API.get", columns: "nb_visits", period: "month" },
      startDate,
      endDate,
    );
    return Object.entries(data).map(([yearMonth, visits]) => ({ yearMonth, visits }));
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
