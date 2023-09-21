import { RequestHandler } from "express";
import { RequestErrorArray } from "../entity/RequestError";
import validator from "validator";
import { Site } from "../entity/Site";
import { DataSource, In, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, isValidDate, toArray } from ".";
import { validate as validateUuid } from "uuid";
import { Product } from "../entity/Product";

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
    /* eslint-disable prefer-template */
    const addDashesToUuid = (uuid: string) =>
      uuid.substr(0, 8) +
      "-" +
      uuid.substr(8, 4) +
      "-" +
      uuid.substr(12, 4) +
      "-" +
      uuid.substr(16, 4) +
      "-" +
      uuid.substr(20);
    /* eslint-enable prefer-template */
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
      "properties",
      "updatedAtFrom",
      "updatedAtTo",
      "s3path",
      "status",
      "privateFrontendOrder",
    ];

    if (req.path.includes("visualization")) validKeys.push("variable");

    if (!req.path.includes("model")) validKeys.push("instrument", "instrumentPid");

    const unknownFields = checkFieldNames(validKeys, req.query);
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`);
    }

    const keys = ["site", "product", "dateFrom", "dateTo", "updatedAtFrom", "updatedAtTo", "volatile", "limit", "date"];
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

  filesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query as any;
    const defaultSite = async () =>
      (await this.siteRepo.find())
        .filter((site) => !(req.query.developer === undefined && site.isTestSite)) // Hide test sites
        .filter((site) => (req.path.includes("search") ? !site.isHiddenSite : true)) // Hide hidden sites from /search
        .map((site) => site.id);
    const defaultProduct = async () =>
      (await this.productRepo.find())
        .filter((prod) => req.query.developer == "true" || prod.level != "3") // Hide experimental products
        .map((prod) => prod.id);
    const setLegacy = () => ("showLegacy" in query ? null : [false]); // Don't filter by "legacy" if showLegacy is enabled
    if (!("site" in query)) query.site = await defaultSite();
    if (!("product" in query)) query.product = await defaultProduct();
    query.site = toArray(query.site);
    query.product = toArray(query.product);
    query.model = toArray(query.model);
    query.volatile = toArray(query.volatile);
    query.filename = toArray(query.filename);
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
    next();
  };

  checkParamsExistInDb: RequestHandler = async (req: any, _res, next) => {
    Promise.all([
      this.checkSite(req),
      this.checkParam("product", req),
      this.checkParam("model", req),
      this.checkParam("instrument", req),
    ])
      .then(() => next())
      .catch(next);
  };

  private throw404Error = (param: string, req: any) => {
    throw { status: 404, errors: [`One or more of the specified ${param}s were not found`], params: req.query };
  };

  private checkParam = async (param: string, req: any) => {
    if (!req.query[param]) return Promise.resolve();
    await this.dataSource
      .getRepository(param)
      .findBy({ id: In(req.query[param]) })
      .then((res) => {
        if (res.length != req.query[param].length) this.throw404Error(param, req);
      });
  };

  checkDeleteParams: RequestHandler = async (req, _res, next) => {
    const query: any = req.query;
    const keys = ["deleteHigherProducts", "dryRun"];
    for (const key of keys) {
      if (!query[key]) return next({ status: 404, errors: [`Missing mandatory parameter: ${key}`] });
      const value = query[key].toLowerCase();
      if (value === "true") query[key] = true;
      else if (value === "false") query[key] = false;
      else next({ status: 400, errors: [`Invalid value for parameter ${key}: ${value}`] });
    }
    next();
  };

  private checkSite = async (req: any) => {
    if (!req.query["site"]) return Promise.resolve();
    let qb = this.siteRepo.createQueryBuilder("site").select().where("site.id IN (:...site)", req.query);
    qb = hideTestDataFromNormalUsers(qb, req);
    await qb.getMany().then((res: any[]) => {
      if (res.length != req.query.site.length) this.throw404Error("site", req);
    });
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
      case "volatile":
        if (key in query && !(query[key].toLowerCase() == "true" || query[key].toLowerCase() == "false")) {
          return `Malformed value in property "${key}"`;
        }
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
