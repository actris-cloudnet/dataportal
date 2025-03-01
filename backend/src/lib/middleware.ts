import { RequestHandler, Response, Request } from "express";
import { RequestErrorArray } from "../entity/RequestError";
import validator from "validator";
import { Site } from "../entity/Site";
import { DataSource, In, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, isValidDate, toArray } from ".";
import { validate as validateUuid } from "uuid";
import { Product, ProductType } from "../entity/Product";

export class Middleware {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.productRepo = dataSource.getRepository(Product);
  }

  private dataSource: DataSource;
  private siteRepo: Repository<Site>;
  private productRepo: Repository<Product>;

  validateUuidParam: RequestHandler = (req, _res, next) => {
    const addDashesToUuid = (uuid: string) =>
      uuid.slice(0, 8) +
      "-" +
      uuid.slice(8, 12) +
      "-" +
      uuid.slice(12, 16) +
      "-" +
      uuid.slice(16, 20) +
      "-" +
      uuid.slice(20);

    const uuid = req.params.uuid.includes("-") ? req.params.uuid : addDashesToUuid(req.params.uuid);
    if (!validateUuid(uuid)) return next({ status: 404, errors: ["Not found: invalid UUID"] });
    return next();
  };

  validateMD5Param: RequestHandler = (req, _res, next) =>
    validator.isMD5(req.params.checksum) ? next() : next({ status: 400, error: "Checksum is not an MD5 hash" });

  filesValidator: RequestHandler = (req, _res, next) => {
    const checkFieldNames = (validKeys: string[], query: any) =>
      Object.keys(query).filter((key) => !validKeys.includes(key));

    const requestError: RequestErrorArray = { status: 400, errors: [] };

    if (Object.keys(req.query).length == 0) {
      requestError.errors.push("No search parameters given");
      return next(requestError);
    }

    const validKeys = [
      "site",
      "volatile",
      "product",
      "dateFrom",
      "dateTo",
      "developer",
      "releasedBefore",
      "allVersions",
      "limit",
      "showLegacy",
      "model",
      "allModels",
      "date",
      "filename",
      "filenamePrefix",
      "filenameSuffix",
      "properties",
      "updatedAtFrom",
      "updatedAtTo",
      "s3path",
      "status",
      "privateFrontendOrder",
      "dvasUpdated",
      "page",
      "pageSize",
    ];

    if (req.path.includes("visualization")) validKeys.push("variable");

    if (!req.path.includes("model")) validKeys.push("instrument", "instrumentPid");

    const unknownFields = checkFieldNames(validKeys, req.query);
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`);
    }

    const keys = [
      "site",
      "product",
      "dateFrom",
      "dateTo",
      "updatedAtFrom",
      "updatedAtTo",
      "volatile",
      "limit",
      "date",
      "dvasUpdated",
      "filename",
      "filenamePrefix",
      "filenameSuffix",
    ];
    keys.forEach((key) => {
      const keyError = this.checkField(key, req.query);
      if (keyError) requestError.errors.push(keyError);
    });

    requestError.errors = this.checkDateConflicts(requestError.errors, req.query);

    if (requestError.errors.length > 0) return next(requestError);
    return next();
  };

  modelFilesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = { status: 400, errors: [] };

    const invalidKeys = ["product", "showLegacy", "allVersions"];

    const foundInvalidKeys = Object.keys(req.query).filter((key) => invalidKeys.includes(key));
    if (foundInvalidKeys.length > 0)
      requestError.errors = requestError.errors.concat([
        `Invalid query parameters for this route: ${foundInvalidKeys.join(", ")}`,
      ]);

    requestError.errors = this.checkModelParamConflicts(requestError.errors, req.query);

    if (requestError.errors.length > 0) return next(requestError);
    return next();
  };

  filesQueryAugmenter: RequestHandler = async (req, res, next) => {
    const query = req.query as any;
    const path = req.path;
    const defaultSite = async () =>
      (await this.siteRepo.find())
        .filter((site) => !(query.developer === undefined && site.isTestSite)) // Hide test sites
        .filter((site) => (path.includes("search") ? !site.isHiddenSite : true)) // Hide hidden sites from /search
        .map((site) => site.id);
    const defaultProduct = async () =>
      (await this.productRepo.find())
        .filter((prod) => query.developer == "true" || !prod.type.includes(ProductType.EVALUATION)) // Hide experimental products
        .map((prod) => prod.id);
    const setLegacy = () => ("showLegacy" in query ? null : [false]); // Don't filter by "legacy" if showLegacy is enabled
    if (!("site" in query)) query.site = await defaultSite();
    if (!("product" in query)) query.product = await defaultProduct();
    query.site = toArray(query.site);
    query.product = toArray(query.product);
    query.model = toArray(query.model);
    query.volatile = toArray(query.volatile);
    query.filename = toArray(query.filename);
    query.filenamePrefix = toArray(query.filenamePrefix);
    query.filenameSuffix = toArray(query.filenameSuffix);
    query.instrument = toArray(query.instrument);
    query.instrumentPid = toArray(query.instrumentPid);
    query.legacy = setLegacy();
    if (query.date) {
      query.dateFrom = query.date;
      query.dateTo = query.date;
    }
    if (query.updatedAtTo) query.updatedAtTo = new Date(query.updatedAtTo);
    if (query.updatedAtFrom) query.updatedAtFrom = new Date(query.updatedAtFrom);
    query.s3path = (query.s3path || "").toLowerCase() == "true";
    Object.assign(res.locals, query);
    next();
  };

  checkParamsExistInDb: RequestHandler = async (req, res, next) => {
    Promise.all([
      this.checkSite(req, res),
      this.checkParam("product", res),
      this.checkParam("model", res),
      this.checkParam("instrument", res),
    ])
      .then(() => next())
      .catch(next);
  };

  private throw404Error = (param: string, res: Response) => {
    throw { status: 404, errors: [`One or more of the specified ${param}s were not found`], params: res.locals };
  };

  private checkParam = async (param: string, res: Response) => {
    if (!res.locals[param]) return Promise.resolve();
    const count = await this.dataSource.getRepository(param).countBy({ id: In(res.locals[param]) });
    if (count != res.locals[param].length) this.throw404Error(param, res);
  };

  checkDeleteParams: RequestHandler = async (req, res, next) => {
    const query = req.query as any;
    const keys = ["deleteHigherProducts", "dryRun"];
    for (const key of keys) {
      if (!query[key]) return next({ status: 404, errors: [`Missing mandatory parameter: ${key}`] });
      const value = query[key].toLowerCase();
      if (value === "true") query[key] = true;
      else if (value === "false") query[key] = false;
      else return next({ status: 400, errors: [`Invalid value for parameter ${key}: ${value}`] });
    }
    if (
      "tombstoneReason" in query &&
      (typeof query.tombstoneReason !== "string" || query.tombstoneReason.trim() === "")
    ) {
      return next({ status: 400, errors: [`Invalid value for tombstoneReason: ${query.tombstoneReason}`] });
    }
    Object.assign(res.locals, query);
    next();
  };

  validateCitationType: RequestHandler = async (req, _res, next) => {
    if (["acknowledgements", "data-availability", "citation"].includes(req.params.type)) return next();
    next({ status: 404, errors: ["Invalid citation type"] });
  };

  validateCitationFormat: RequestHandler = async (req, _res, next) => {
    const query = req.query as any;
    if (!query.format) query.format = "html";
    if (req.params.type === "citation") {
      if (["bibtex", "ris", "html", "txt"].includes(query.format)) return next();
    } else {
      if (["html", "txt"].includes(query.format)) return next();
    }
    next({ status: 404, errors: ["Invalid citation format"] });
  };

  private checkSite = async (req: Request, res: Response) => {
    if (!res.locals.site) return Promise.resolve();
    let qb = this.siteRepo.createQueryBuilder("site").select().where("site.id IN (:...site)", res.locals);
    qb = hideTestDataFromNormalUsers(qb, req);
    const count = await qb.getCount();
    if (count != res.locals.site.length) this.throw404Error("site", res);
  };

  private checkField = (key: string, query: any): string | void => {
    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0;

    if (key in query && query[key].length == 0) return `Property ${key} is empty`;

    switch (key) {
      case "product":
        if (
          key in query &&
          !(
            (typeof query[key] == "string" && validator.matches(query[key], /[a-zA-Z-_]/)) ||
            isArrayWithElements(query[key])
          )
        ) {
          return `Malformed ${key}`;
        }
        break;
      case "updatedAtFrom":
      case "updatedAtTo":
      case "date":
      case "dateTo":
      case "dateFrom":
        if (key in query && !isValidDate(query[key])) {
          return `Malformed date in property "${key}"`;
        }
        break;
      case "limit":
        if (key in query && isNaN(parseInt(query[key]))) {
          return `Malformed value in property "${key}"`;
        }
        break;
      case "dvasUpdated":
      case "volatile":
        if (key in query && !(query[key].toLowerCase() == "true" || query[key].toLowerCase() == "false")) {
          return `Malformed value in property "${key}"`;
        }
        break;
      case "filename":
      case "filenamePrefix":
      case "filenameSuffix":
        if (
          key in query &&
          Array.isArray(query[key]) &&
          !query[key].every((item: any) => typeof item === "string" && item.trim() !== "")
        ) {
          return `Malformed ${key}`;
        }
        break;
    }
  };

  private checkModelParamConflicts = (errors: string[], query: any) => {
    if (query.allModels && query.model) errors.push('Properties "allModels" and "model" can not be both defined');
    return errors;
  };

  private checkDateConflicts(errors: string[], query: any) {
    if (query.date && (query.dateFrom || query.dateTo))
      errors.push('Property "date" may not be defined if either "dateFrom" or "dateTo" is defined');
    return errors;
  }
}
