import { RequestHandler, Response, Request } from "express";
import { RequestErrorArray } from "../entity/RequestError";
import validator from "validator";
import { Site } from "../entity/Site";
import { DataSource, In, Repository } from "typeorm";
import { hideTestDataFromNormalUsers, isValidDate, toArray } from ".";
import { validate as validateUuid } from "uuid";
import { Product, ProductType } from "../entity/Product";
import { MonitoringFile, PeriodType } from "../entity/MonitoringFile";
import { MonitoringProductVariable } from "../entity/MonitoringProductVariable";

export class Middleware {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.productRepo = dataSource.getRepository(Product);
    this.monitoringFileRepo = dataSource.getRepository(MonitoringFile);
    this.monitoringProductVariableRepo = dataSource.getRepository(MonitoringProductVariable);
  }

  private dataSource: DataSource;
  private siteRepo: Repository<Site>;
  private productRepo: Repository<Product>;
  private monitoringFileRepo: Repository<MonitoringFile>;
  private monitoringProductVariableRepo: Repository<MonitoringProductVariable>;

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
      "releasedAfter",
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
      "releasedBefore",
      "releasedAfter",
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
    if (query.releasedBefore) query.releasedBefore = new Date(query.releasedBefore);
    if (query.releasedAfter) query.releasedAfter = new Date(query.releasedAfter);
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

  private throwBadRequestError = (param: string, res: Response, invalidIds: string[]) => {
    const paramSuffix = invalidIds.length === 1 ? "" : "s";
    throw {
      status: 400,
      errors: [`Invalid ${param}${paramSuffix}: ${invalidIds.join(", ")}`],
      params: res.locals,
    };
  };

  private checkParam = async (param: string, res: Response) => {
    const requestedIds: string[] | undefined = res.locals[param];
    if (!requestedIds || requestedIds.length === 0) {
      return Promise.resolve();
    }
    const entities = await this.dataSource.getRepository(param).find({
      select: { id: true },
      where: { id: In(requestedIds) },
    });
    const validIds = entities.map((entity) => entity.id);
    const invalidIds = requestedIds.filter((id) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      this.throwBadRequestError(param, res, invalidIds);
    }
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

  validateMonitoringVisQuery: RequestHandler = async (req, res, next) => {
    const query = req.query as any;
    const validKeys = new Set(["productId", "variableId", "siteId", "instrumentUuid", "period", "startDate"]);
    const requestError: RequestErrorArray = { status: 400, errors: [] };
    if (Object.keys(req.query).length == 0) {
      requestError.errors.push("No search parameters given");
      return next(requestError);
    }

    const invalidKeys = Object.keys(query).filter((key) => !validKeys.has(key));
    if (invalidKeys.length > 0) {
      requestError.errors.push(`Invalid query paramters: ${invalidKeys.join(", ")}`);
      return next(requestError);
    }
    query.productId = toArray(query.productId);
    query.variableId = toArray(query.variableId);
    query.siteId = toArray(query.siteId);
    query.instrumentUuid = toArray(query.instrumentUuid);
    query.period = toArray(query.period);
    query.startDate = toArray(query.startDate);
    Object.assign(res.locals, query);
    next();
  };

  validatePutMonitoringFile: RequestHandler = async (req, res, next) => {
    const { uuid, startDate, periodType, siteId, productId: monitoringProductId, instrumentUuid } = req.body;
    const errors: string[] = [];

    if (uuid && !validateUuid(uuid)) {
      errors.push("Invalid UUID");
    }

    if (!siteId || typeof siteId !== "string") {
      errors.push("Missing or invalid 'siteId' (must be string).");
    }

    if (!monitoringProductId || typeof monitoringProductId !== "string") {
      errors.push("Missing or invalid 'monitoringProductId' (must be string).");
    }

    if (!instrumentUuid || !validateUuid(instrumentUuid)) {
      errors.push("Missing or invalid 'instrumentUuid' (must be UUID).");
    }

    if (!periodType || !Object.values(PeriodType).includes(periodType)) {
      errors.push(`Invalid or missing 'periodType'. Must be one of: ${Object.values(PeriodType).join(", ")}`);
    }

    if (periodType !== PeriodType.ALL && !isValidDate(startDate)) {
      errors.push("Missing or invalid 'startDate' (must be valid YYYY-MM-DD if periodType is not 'all').");
    }

    if (errors.length > 0) {
      return next({ status: 400, errors } as RequestErrorArray);
    }
    res.locals.fileData = {
      ...(uuid ? { uuid } : {}),
      siteId,
      monitoringProductId,
      instrumentUuid,
      periodType,
      startDate: periodType === PeriodType.ALL ? null : startDate,
    };
    return next();
  };

  validatePutMonitoringVisualization: RequestHandler = async (req, res, next) => {
    const {
      s3key,
      sourceFileUuid,
      variableId: monitoringProductVariableId,
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    } = req.body;

    const errors: string[] = [];

    // s3key
    if (typeof s3key !== "string" || s3key.trim() === "") {
      errors.push("Missing or invalid 's3key'. Must be a non-empty string.");
    } else {
      const pattern = /^monitoring\/(.+)/;
      const match = s3key.match(pattern);
      if (!match || !match[1].trim()) {
        errors.push("'s3key' must start with 'monitoring/' followed by a non-empty path.");
      }
    }

    // sourceFileUuid
    if (!validateUuid(sourceFileUuid)) {
      errors.push("Missing or invalid 'sourceFileUuid'. Must be a valid UUID.");
    }

    // monitoringProductVariableId
    if (typeof monitoringProductVariableId !== "string" || monitoringProductVariableId.trim() === "") {
      errors.push("Missing or invalid 'monitoringProductVariableId'. Must be a non-empty string.");
    }

    // Optional smallint fields
    const optionalFields: Record<string, any> = {
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    };

    for (const [field, value] of Object.entries(optionalFields)) {
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < 0 || value > 32767) {
          errors.push(`Field '${field}' must be a non-negative integer under 32768 (smallint).`);
        }
      }
    }

    // Skip db checks if UUID or ID format are already invalid
    if (!errors.length) {
      try {
        const file = await this.monitoringFileRepo.findOneBy({ uuid: sourceFileUuid });
        if (!file) errors.push(`MonitoringFile with UUID ${sourceFileUuid} does not exist.`);

        const variable = await this.monitoringProductVariableRepo.findOneBy({ id: monitoringProductVariableId });
        if (!variable) {
          errors.push(`MonitoringProductVariable with ID ${monitoringProductVariableId} does not exist.`);
        }
      } catch (err) {
        console.error(err);
        return next({ status: 500, errors: ["Failed to validate related entities."] });
      }
    }

    if (errors.length > 0) {
      return next({ status: 400, errors } as RequestErrorArray);
    }

    res.locals.visualisationData = {
      s3key,
      sourceFileUuid,
      monitoringProductVariableId,
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    };
    return next();
  };

  private checkSite = async (req: Request, res: Response) => {
    const requestedIds: string[] | undefined = res.locals.site;
    if (!requestedIds || requestedIds.length === 0) {
      return Promise.resolve();
    }
    let qb = this.siteRepo.createQueryBuilder("site").select("site.id").where("site.id IN (:...site)", res.locals);
    qb = hideTestDataFromNormalUsers(qb, req);
    const entities = await qb.getMany();
    const validIds = entities.map((entity) => entity.id);
    const invalidIds = requestedIds.filter((id) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      this.throwBadRequestError("site", res, invalidIds);
    }
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
      case "releasedBefore":
      case "releasedAfter":
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
