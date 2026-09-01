import { RequestHandler } from "express";
import { QueueService } from "../lib/queue";
import { isTaskStatus, Task, TaskStatus } from "../entity/Task";
import { DataSource, In, Repository } from "typeorm";
import { randomName } from "../lib/random";
import { Product, ProductType } from "../entity/Product";
import { Instrument, InstrumentInfo } from "../entity/Instrument";
import { Model } from "../entity/Model";
import { Site, SiteType } from "../entity/Site";
import { findSourceInstrumentIds, isStringArray, toArray } from "../lib";

export class QueueRoutes {
  readonly queueService: QueueService;
  readonly dataSource: DataSource;
  readonly siteRepo: Repository<Site>;
  readonly productRepo: Repository<Product>;
  readonly instrumentRepo: Repository<Instrument>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly modelRepo: Repository<Model>;

  constructor(dataSource: DataSource, queueService: QueueService) {
    this.queueService = queueService;
    this.dataSource = dataSource;
    this.siteRepo = dataSource.getRepository(Site);
    this.productRepo = dataSource.getRepository(Product);
    this.instrumentRepo = dataSource.getRepository(Instrument);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.modelRepo = dataSource.getRepository(Model);
  }

  submitBatch: RequestHandler = async (req, res, next) => {
    const searchParams = req.body;
    try {
      await Promise.all([
        this.checkParam(this.siteRepo, "id", searchParams, "siteIds"),
        this.checkParam(this.productRepo, "id", searchParams, "productIds"),
        this.checkParam(this.instrumentRepo, "id", searchParams, "instrumentIds"),
        this.checkParam(this.modelRepo, "id", searchParams, "modelIds"),
        this.checkParam(this.instrumentInfoRepo, "uuid", searchParams, "instrumentUuids"),
      ]);
      searchParams.options = this.queueService.validateTaskOptions(searchParams.type, searchParams.options);
    } catch (error: any) {
      return next({ status: 400, errors: error.message || "Unknown error" });
    }
    if (searchParams.modelIds && !searchParams.productIds) {
      searchParams.productIds = ["model"];
    }

    const batchId = randomName();
    const batches = [];
    batches.push(this.submitInstrumentBatch(searchParams, batchId));
    // Remove mwr-l1c, should be handled in instrument batch already...
    if (searchParams.productIds) {
      searchParams.productIds = searchParams.productIds.filter((id: any) => id !== "mwr-l1c");
    }
    if (searchParams.productIds) {
      if (searchParams.productIds.includes("model")) {
        batches.push(this.submitModelBatch(searchParams, batchId));
      }
      const products = await this.productRepo.find({
        where: { id: In(searchParams.productIds) },
        relations: { sourceProducts: true },
      });
      for (const product of products) {
        if (product.id.startsWith("l3-")) {
          if (!searchParams.instrumentIds && !searchParams.instrumentUuids) {
            batches.push(this.submitEvaluationBatch(searchParams, batchId, product));
          }
        } else if (product.sourceProducts.length > 0) {
          batches.push(this.submitProductBatch(searchParams, batchId, product));
          if (!product.type.includes(ProductType.INSTRUMENT)) {
            batches.push(this.submitArmBatch(searchParams, batchId, product));
          }
        }
      }
    }
    const results = await Promise.all(batches);
    if (searchParams.dryRun) {
      const total = results
        .filter((a) => !!a)
        .reduce(
          (a, b) => {
            a.taskCount += b.taskCount;
            if (a.dateFrom < b.dateFrom) a.dateFrom = b.dateFrom;
            if (a.dateTo > b.dateTo) a.dateTo = b.dateTo;
            for (const siteId of b.siteIds) a.siteIds.add(siteId);
            for (const productId of b.productIds) a.productIds.add(productId);
            return a;
          },
          {
            taskCount: 0,
            dateFrom: "0000-00-00",
            dateTo: "9999-99-99",
            siteIds: new Set(),
            productIds: new Set(),
          },
        );
      res.send({
        ...total,
        siteIds: [...total.siteIds],
        productIds: [...total.productIds],
      });
    } else {
      res.send({ batchId });
    }
  };

  cancelBatch: RequestHandler = async (req, res) => {
    await this.queueService.cancelBatch(req.params.batchId as string);
    res.sendStatus(204);
  };

  publish: RequestHandler = async (req, res) => {
    const body = req.body;

    const task = new Task();
    task.type = body.type;
    task.siteId = body.siteId;
    task.productId = body.productId;
    task.measurementDate = body.measurementDate;
    if (body.instrumentInfoUuid) {
      task.instrumentInfoUuid = body.instrumentInfoUuid;
    }
    if (body.modelId) {
      task.modelId = body.modelId;
    }
    task.scheduledAt = "scheduledAt" in body ? new Date(body.scheduledAt) : new Date();
    task.priority = "priority" in body ? body.priority : 50;
    task.options = body.options;
    if (body.queue) {
      task.queueId = body.queue;
    }

    await this.queueService.publish(task);
    res.send(task);
  };

  setPriority: RequestHandler = async (req, res, next) => {
    const id = req.params.id as string;
    const priority = req.body.priority;
    if (typeof priority !== "number" || priority < 0 || priority > 100) {
      return next({
        status: 400,
        errors: ["Priority must be a number between 0 and 100"],
      });
    }
    await this.queueService.setPriority(id, priority);
    res.sendStatus(204);
  };

  receive: RequestHandler = async (req, res, next) => {
    const queueId = req.query.queue;
    if (typeof queueId !== "undefined" && typeof queueId !== "string") {
      return next({ status: 400, errors: ["Invalid queue parameter"] });
    }
    const task = await this.queueService.receive({ queueId });
    if (task) {
      res.send(task);
    } else {
      res.sendStatus(204);
    }
  };

  fail: RequestHandler = async (req, res) => {
    await this.queueService.fail(req.params.id as string);
    res.sendStatus(204);
  };

  complete: RequestHandler = async (req, res) => {
    await this.queueService.complete(req.params.id as string);
    res.sendStatus(204);
  };

  getQueue: RequestHandler = async (req, res, next) => {
    const queueId = req.query.queue;
    if (typeof queueId !== "undefined" && typeof queueId !== "string") {
      return next({ status: 400, errors: ["Invalid queue parameter"] });
    }
    const batchId = req.query.batch;
    if (typeof batchId !== "undefined" && typeof batchId !== "string") {
      return next({ status: 400, errors: ["Invalid batch parameter"] });
    }
    const status = toArray(req.query.status);
    if (typeof status !== "undefined" && (!isStringArray(status) || !status.every(isTaskStatus))) {
      return next({ status: 400, errors: ["Invalid status parameter"] });
    }
    const offset = typeof req.query.offset === "string" ? parseInt(req.query.offset, 10) : undefined;
    if (typeof offset !== "undefined" && !isFinite(offset)) {
      return next({ status: 400, errors: ["Invalid offset parameter"] });
    }
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
    if (typeof limit !== "undefined" && !isFinite(limit)) {
      return next({ status: 400, errors: ["Invalid limit parameter"] });
    }
    const doneAfter = typeof req.query.doneAfter === "string" ? new Date(req.query.doneAfter) : undefined;
    if (typeof doneAfter !== "undefined" && isNaN(doneAfter.getTime())) {
      return next({ status: 400, errors: ["Invalid doneAfter parameter"] });
    }
    const type = req.query.type;
    if (typeof type !== "undefined" && typeof type !== "string") {
      return next({ status: 400, errors: ["Invalid type parameter"] });
    }
    const siteId = req.query.siteId;
    if (typeof siteId !== "undefined" && typeof siteId !== "string") {
      return next({ status: 400, errors: ["Invalid siteId parameter"] });
    }
    const productId = req.query.productId;
    if (typeof productId !== "undefined" && typeof productId !== "string") {
      return next({ status: 400, errors: ["Invalid productId parameter"] });
    }
    const reverse = !!req.query.reverse;
    const order = req.query.order;
    if (typeof order !== "undefined" && order !== "priority" && order !== "scheduledAt") {
      return next({ status: 400, errors: ["Invalid order parameter"] });
    }
    const queue = await this.queueService.getQueue({
      queueId,
      batchId,
      status: status as TaskStatus[],
      type,
      siteId,
      productId,
      offset,
      limit,
      doneAfter,
      reverse,
      order,
    });
    res.send({ tasks: queue[0], totalTasks: queue[1] });
  };

  private async submitInstrumentBatch(filters: Record<string, any>, batchId: string) {
    const where = [];
    const parameters = [];
    if (filters.instrumentIds) {
      where.push(`instrument_info."instrumentId" = ANY ($${parameters.length + 1})`);
      parameters.push(filters.instrumentIds);
    }
    if (filters.instrumentUuids) {
      where.push(`upload."instrumentInfoUuid" = ANY ($${parameters.length + 1})`);
      parameters.push(filters.instrumentUuids);
    }
    if (filters.productIds) {
      where.push(`derived_product."productId" = ANY ($${parameters.length + 1})`);
      parameters.push(filters.productIds);
    }
    return this.batchQuery(filters, where, parameters, {
      table: "instrument_upload",
      batchId,
      productId: `derived_product."productId"`,
      instrumentInfoUuid: `upload."instrumentInfoUuid"`,
      join: `JOIN instrument_info ON instrument_info.uuid = upload."instrumentInfoUuid"
           JOIN instrument_derived_products_product derived_product ON derived_product."instrumentId" = instrument_info."instrumentId"`,
    });
  }

  private async submitModelBatch(filters: Record<string, any>, batchId: string) {
    return this.batchQuery(filters, [], [], {
      table: "model_upload",
      batchId,
      productId: "'model'::text",
      modelId: `upload."modelId"`,
    });
  }

  /// Submit batch for an L3 product: task per model with a processed model file.
  private async submitEvaluationBatch(filters: Record<string, any>, batchId: string, product: Product) {
    const where = [`upload."tombstoneReason" IS NULL`];
    const parameters = [product.id];
    return this.batchQuery(filters, where, parameters, {
      table: "model_file",
      batchId,
      productId: "$1::text",
      modelId: `upload."modelId"`,
    });
  }

  /// Submit derived product batch for ARM sites: instrument files from ARM
  /// sites are not in the data portal, so create categorize tasks for days
  /// with model data.
  private async submitArmBatch(filters: Record<string, any>, batchId: string, product: Product) {
    const where = [];
    const parameters = [];

    const productId = `$${parameters.length + 1}::text`;
    parameters.push(product.id);

    where.push(`$${parameters.length + 1} = ANY (site.type)`);
    parameters.push(SiteType.ARM);

    where.push(`upload."tombstoneReason" IS NULL`);

    return this.batchQuery(filters, where, parameters, {
      table: "model_file",
      batchId,
      join: `JOIN site ON site.id = upload."siteId"`,
      productId,
    });
  }

  /// Submit batch for a product derived from other products (e.g. categorize
  /// and mwr-single). Tasks are created only for days that contain any uploads
  /// from related instruments.
  private async submitProductBatch(filters: Record<string, any>, batchId: string, product: Product) {
    const where = [];
    const parameters = [];

    const productId = `$${parameters.length + 1}::text`;
    parameters.push(product.id);

    where.push(`instrument_info."instrumentId" = ANY ($${parameters.length + 1})`);
    parameters.push(await findSourceInstrumentIds(this.dataSource, product.id));

    return this.batchQuery(filters, where, parameters, {
      table: "instrument_upload",
      batchId,
      join: `JOIN instrument_info ON instrument_info.uuid = upload."instrumentInfoUuid"`,
      instrumentInfoUuid: product.type.includes(ProductType.INSTRUMENT) ? `upload."instrumentInfoUuid"` : undefined,
      productId,
    });
  }

  private async batchQuery(
    searchParams: Record<string, any>,
    where: string[],
    parameters: any[],
    options: {
      table: string;
      batchId: string;
      productId: string;
      instrumentInfoUuid?: string;
      modelId?: string;
      join?: string;
    },
  ) {
    if (searchParams.siteIds) {
      where.push(`upload."siteId" = ANY ($${parameters.length + 1})`);
      parameters.push(searchParams.siteIds);
    }
    if (searchParams.modelIds && options.modelId) {
      where.push(`${options.modelId} = ANY ($${parameters.length + 1})`);
      parameters.push(searchParams.modelIds);
    }
    if (searchParams.date) {
      where.push(`upload."measurementDate" = $${parameters.length + 1}`);
      parameters.push(searchParams.date);
    }
    if (searchParams.dateFrom) {
      where.push(`upload."measurementDate" >= $${parameters.length + 1}`);
      parameters.push(searchParams.dateFrom);
    }
    if (searchParams.dateTo) {
      where.push(`upload."measurementDate" <= $${parameters.length + 1}`);
      parameters.push(searchParams.dateTo);
    }
    const columns = [
      `$${parameters.length + 1}::task_type_enum`, // type
      `upload."siteId"`, // siteId
      `upload."measurementDate"`, // measurementDate
      `${options.productId} AS "productId"`, // productId
      `${options.instrumentInfoUuid || "NULL::uuid"}`, // instrumentInfoUuid
      `${options.modelId || "NULL::text"}`, // modelId
      `'${TaskStatus.CREATED}'::task_status_enum`, // status
      `50`, // priority
      `now() AT TIME ZONE 'utc'`, // scheduledAt
      `$${parameters.length + 2}::text`, // batchId
      `$${parameters.length + 3}::jsonb`, // options
      `$${parameters.length + 4}::text`, // queueId
    ].join(", ");
    let query = `SELECT DISTINCT ${columns} FROM ${options.table} upload`;
    if (options.join) {
      query += ` ${options.join}`;
    }
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    parameters.push(searchParams.type, options.batchId, searchParams.options, searchParams.queueId || null);
    if (searchParams.dryRun) {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) AS "taskCount",
                to_char(MIN("measurementDate"), 'YYYY-MM-DD') AS "dateFrom",
                to_char(MAX("measurementDate"), 'YYYY-MM-DD') AS "dateTo",
                array_agg(DISTINCT "siteId") AS "siteIds",
                array_agg(DISTINCT "productId") AS "productIds"
        FROM (${query}) t`,
        parameters,
      );
      return {
        taskCount: parseInt(result[0].taskCount),
        dateFrom: result[0].dateFrom as string,
        dateTo: result[0].dateTo as string,
        siteIds: new Set(result[0].siteIds as string[]),
        productIds: new Set(result[0].productIds as string[]),
      };
    } else {
      await this.queueService.publishSql(query, parameters);
    }
  }

  private async checkParam(repo: any, column: string, searchParams: any, key: string) {
    if (!(key in searchParams)) return null;
    if (!isStringArray(searchParams[key])) {
      throw new Error(`${key} should be string array`);
    }
    const objs = await repo.find({ where: { [column]: In(searchParams[key]) }, select: [column] });
    const validIds = new Set(objs.map((obj: any) => obj[column]));
    const invalidIds = searchParams[key].filter((id: any) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid ${key}: ${invalidIds.join(", ")}`);
    }
  }
}
