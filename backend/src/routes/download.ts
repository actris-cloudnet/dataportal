import { Request, RequestHandler, Response, NextFunction } from "express";
import { CountryResponse, Reader } from "maxmind";
import { readFileSync } from "fs";

import { Collection } from "../entity/Collection";
import { DataSource, Not, Repository } from "typeorm";
import { File, RegularFile } from "../entity/File";
import { Status, Upload } from "../entity/Upload";
import { Download, ObjectType } from "../entity/Download";
import {
  getS3pathForFile,
  getS3pathForImage,
  getS3pathForUpload,
  ssAuthString,
  isValidDate,
  getCollectionLandingPage,
} from "../lib";
import * as http from "http";
import { IncomingMessage } from "http";
import archiver = require("archiver");
import { FileRoutes } from "./file";
import env from "../lib/env";
import { CollectionRoutes } from "./collection";
import { UploadRoutes } from "./upload";
import { CitationService } from "../lib/cite";
import { citation2txt } from "./reference";
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

const LICENSE_TEXT = readFileSync("data/CC-BY-4.0.txt");

export class DownloadRoutes {
  constructor(
    dataSource: DataSource,
    fileController: FileRoutes,
    collController: CollectionRoutes,
    uploadController: UploadRoutes,
    ipLookup: Reader<CountryResponse>,
  ) {
    this.dataSource = dataSource;
    this.collectionRepo = dataSource.getRepository(Collection);
    this.uploadRepo = dataSource.getRepository(Upload);
    this.downloadRepo = dataSource.getRepository(Download);
    this.fileRepo = dataSource.getRepository(RegularFile);
    this.fileController = fileController;
    this.collController = collController;
    this.uploadController = uploadController;
    this.ipLookup = ipLookup;
    this.citationService = new CitationService(dataSource);
  }

  readonly dataSource: DataSource;
  readonly collectionRepo: Repository<Collection>;
  readonly fileRepo: Repository<RegularFile>;
  readonly uploadRepo: Repository<Upload>;
  readonly downloadRepo: Repository<Download>;
  readonly fileController: FileRoutes;
  readonly uploadController: UploadRoutes;
  readonly collController: CollectionRoutes;
  readonly ipLookup: Reader<CountryResponse>;
  readonly citationService: CitationService;

  product: RequestHandler = async (req, res, next) => {
    const s3key = req.params[0];
    try {
      const file = await this.fileController.findAnyFile((repo) => repo.findOneBy({ uuid: req.params.uuid, s3key }));
      if (!file) return next({ status: 404, errors: ["File not found"] });
      const upstreamRes = await this.makeFileRequest(file);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", file.size);
      await this.trackDownload(req, ObjectType.Product, file.uuid);
      upstreamRes.pipe(res, { end: true });
    } catch (e) {
      next({ status: 500, errors: e });
    }
  };

  raw: RequestHandler = async (req, res, next) => {
    const filename = req.params[0];
    try {
      const file = await this.uploadController.findAnyUpload((repo) =>
        repo.findOne({
          where: { uuid: req.params.uuid, filename, status: Not(Status.CREATED) },
          relations: { site: true },
        }),
      );
      if (!file) return next({ status: 404, errors: ["File not found"] });
      const upstreamRes = await this.makeRawFileRequest(file);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", file.size);
      await this.trackDownload(req, ObjectType.Raw, file.uuid);
      upstreamRes.pipe(res, { end: true });
    } catch (e) {
      next({ status: 500, errors: e });
    }
  };

  collection: RequestHandler = async (req, res, next) => {
    const collectionUuid: string = req.params.uuid;
    const collection = await this.collController.findCollection(collectionUuid);
    if (!collection) {
      return next({ status: 404, errors: ["No collection matches this UUID."] });
    }

    const allFiles = (collection.regularFiles as unknown as File[]).concat(collection.modelFiles);
    await this.trackDownload(req, ObjectType.Collection, collection.uuid);
    try {
      const archive = archiver("zip", { store: true });
      archive.on("warning", console.error);
      archive.on("error", console.error);
      req.on("close", () => archive.abort());

      const shortUuid = collection.uuid.toLowerCase().replace(/-/g, "").slice(0, 16);
      const receiverFilename = `cloudnet-collection-${shortUuid}.zip`;
      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="${receiverFilename}"`);
      archive.pipe(res);

      archive.append(await this.generateReadme(collection), { name: "README.md" });
      archive.append(LICENSE_TEXT, { name: "LICENSE.txt" });

      const appendFile = async (idx: number) => {
        const file = allFiles[idx];
        const fileStream = await this.makeFileRequest(file);
        archive.append(fileStream, { name: file.filename });
        if (idx == allFiles.length - 1) {
          await archive.finalize();
        }
      };
      let i = -2;
      archive.on("entry", (_entry) => {
        i++;
        if (i > 0 && i < allFiles.length) {
          appendFile(i);
        }
      });
      await appendFile(0);
    } catch (err) {
      res.sendStatus(500);
      next(err);
    }
  };

  image: RequestHandler = async (req, res, next) => {
    const s3key = req.params[0];
    try {
      const upstreamRes = await this.makeRequest(getS3pathForImage(s3key));
      if (upstreamRes.statusCode != 200) {
        res.status(upstreamRes.statusCode || 500);
        res.setHeader("Content-Type", "text/plain");
      } else {
        res.setHeader("Content-Type", "image/png");
      }
      upstreamRes.pipe(res, { end: true });
    } catch (e) {
      next({ status: 500, errors: e });
    }
  };

  stats: RequestHandler = async (req, res, next) => {
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

  private makeFileRequest(file: File): Promise<IncomingMessage> {
    return this.makeRequest(getS3pathForFile(file), file.version);
  }

  private makeRawFileRequest(file: Upload): Promise<IncomingMessage> {
    return this.makeRequest(getS3pathForUpload(file));
  }

  private async makeRequest(s3path: string, version?: string): Promise<IncomingMessage> {
    const headers = {
      Authorization: ssAuthString(),
    };

    if (version) {
      s3path = `${s3path}?version=${version}`;
    }

    const requestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: "GET",
    };

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, resolve);
      req.on("error", (err) => reject({ status: 500, errors: err }));
      req.end();
    });
  }

  private async trackDownload(req: Request, type: ObjectType, uuid: string) {
    if (!req.ip) return;
    const result = this.ipLookup.get(req.ip);
    const dl = new Download(type, uuid, req.ip, result?.country?.iso_code);
    await this.downloadRepo.save(dl);
  }

  private async generateReadme(collection: Collection): Promise<string> {
    let citationText = "";
    try {
      const citation = await this.citationService.getCollectionCitation(collection);
      citationText = citation2txt(citation);
    } catch (e) {
      citationText = "Failed to generate citation.";
    }
    const lines = [
      "# README",
      `These files were downloaded from Cloudnet data portal: <${
        collection.pid ? collection.pid : getCollectionLandingPage(collection)
      }>`,
      "## Citation",
      citationText,
      "## License",
      "Cloudnet data is licensed under a Creative Commons Attribution 4.0 international licence.",
      "You should have received a copy of the license along with this work. If not, see <http://creativecommons.org/licenses/by/4.0/>.",
    ];
    return lines.join("\n\n");
  }
}
