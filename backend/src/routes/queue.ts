import { NextFunction, RequestHandler } from "express";
import { QueueService } from "../lib/queue";
import { Task, TaskStatus } from "../entity/Task";
import { DataSource, In, Repository } from "typeorm";
import { randomName } from "../lib/random";
import { Product } from "../entity/Product";
import { Instrument, InstrumentInfo } from "../entity/Instrument";
import { Model } from "../entity/Model";
import { Site } from "../entity/Site";
import { isStringArray } from "../lib";

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
    try {
      const searchParams = req.body;
      await Promise.all([
        this.checkParam(this.siteRepo, "id", searchParams, "siteIds", next),
        this.checkParam(this.productRepo, "id", searchParams, "productIds", next),
        this.checkParam(this.instrumentRepo, "id", searchParams, "instrumentIds", next),
        this.checkParam(this.modelRepo, "id", searchParams, "modelIds", next),
        this.checkParam(this.instrumentInfoRepo, "uuid", searchParams, "instrumentUuids", next),
      ]);
      if (searchParams.modelIds) {
        if (!("productIds" in searchParams)) {
          searchParams.productIds = ["model"];
        } else if (searchParams.productIds.includes("model")) {
          searchParams.productIds.push("model");
        }
      }

      const batchId = randomName();
      const batches = [];
      batches.push(this.submitInstrumentBatch(searchParams, batchId));
      if (searchParams.productIds) {
        if (searchParams.productIds.includes("model")) {
          batches.push(this.submitModelBatch(searchParams, batchId));
        }
        const products = await this.productRepo.find({
          where: { id: In(searchParams.productIds) },
          relations: { sourceProducts: true },
        });
        for (const product of products) {
          if (product.sourceProducts.length === 0) continue;
          batches.push(this.submitProductBatch(searchParams, batchId, product.id));
        }
      }
      const counts = await Promise.all(batches);
      res.send(searchParams.dryRun ? { taskCount: counts.reduce((total, count) => total + count, 0) } : { batchId });
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  cancelBatch: RequestHandler = async (req, res, next) => {
    try {
      await this.queueService.cancelBatch(req.params.batchId);
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  publish: RequestHandler = async (req, res, next) => {
    try {
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

      await this.queueService.publish(task);
      res.send(task);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  receive: RequestHandler = async (req, res, next) => {
    try {
      const task = await this.queueService.receive();
      if (task) {
        res.send(task);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  fail: RequestHandler = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await this.queueService.fail(id);
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  complete: RequestHandler = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await this.queueService.complete(id);
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  getQueue: RequestHandler = async (req, res, next) => {
    try {
      const batchId = req.query.batch;
      if (typeof batchId !== "undefined" && typeof batchId !== "string") {
        return next({ status: 400, errors: ["Invalid batch parameter"] });
      }
      const queue = await this.queueService.getQueue(batchId);
      res.send(queue);
    } catch (err) {
      console.log(err);
      next({ status: 500, errors: err });
    }
  };

  private async submitInstrumentBatch(filters: Record<string, any>, batchId: string) {
    const where = [];
    const parameters = [];
    if (filters.instrumentIds) {
      where.push(`upload."instrumentId" = ANY ($${parameters.length + 1})`);
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
      join: `JOIN instrument_derived_products_product derived_product ON derived_product."instrumentId" = upload."instrumentId"`,
    });
  }

  private async submitModelBatch(filters: Record<string, any>, batchId: string) {
    const where = [];
    const parameters = [];
    if (filters.modelIds) {
      where.push(`upload."modelId" = ANY ($${parameters.length + 1})`);
      parameters.push(filters.modelIds);
    }
    return this.batchQuery(filters, where, parameters, {
      table: "model_upload",
      batchId,
      productId: "'model'::text",
      modelId: `upload."modelId"`,
    });
  }

  /// Submit batch for non-instrument products. Tasks are created only for days
  /// that contain instrument uploads.
  private async submitProductBatch(filters: Record<string, any>, batchId: string, productId: string) {
    const where: string[] = [];
    const parameters = [productId];
    return this.batchQuery(filters, where, parameters, {
      table: "instrument_upload",
      batchId,
      productId: `$${parameters.length}::text`,
    });
  }

  private async batchQuery(
    filters: Record<string, any>,
    where: string[],
    parameters: string[],
    options: {
      table: string;
      batchId: string;
      productId: string;
      instrumentInfoUuid?: string;
      modelId?: string;
      join?: string;
    },
  ) {
    if (filters.siteIds) {
      where.push(`upload."siteId" = ANY ($${parameters.length + 1})`);
      parameters.push(filters.siteIds);
    }
    if (filters.date) {
      where.push(`upload."measurementDate" = $${parameters.length + 1}`);
      parameters.push(filters.date);
    }
    if (filters.dateFrom) {
      where.push(`upload."measurementDate" >= $${parameters.length + 1}`);
      parameters.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.push(`upload."measurementDate" <= $${parameters.length + 1}`);
      parameters.push(filters.dateTo);
    }
    const columns = [
      `$${parameters.length + 1}::task_type_enum`, // type
      `upload."siteId"`, // siteId
      `upload."measurementDate"`, // measurementDate
      `${options.productId}`, // productId
      `${options.instrumentInfoUuid || "NULL::uuid"}`, // instrumentInfoUuid
      `${options.modelId || "NULL::text"}`, // modelId
      `'${TaskStatus.CREATED}'::task_status_enum`, // status
      `50`, // priority
      `now() AT TIME ZONE 'utc'`, // scheduledAt
      `$${parameters.length + 2}::text`, // batchId
    ].join(", ");
    const select = filters.dryRun ? `COUNT(DISTINCT (${columns})) AS "taskCount"` : `DISTINCT ${columns}`;
    let query = `SELECT ${select} FROM ${options.table} upload`;
    if (options.join) {
      query += ` ${options.join}`;
    }
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    parameters.push(filters.type, options.batchId);
    if (filters.dryRun) {
      const result = await this.dataSource.query(query, parameters);
      return parseInt(result[0].taskCount);
    } else {
      await this.queueService.publishSql(query, parameters);
      return 0;
    }
  }

  private async checkParam(repo: any, column: string, searchParams: any, key: string, next: NextFunction) {
    if (!(key in searchParams)) return;
    if (!isStringArray(searchParams[key])) {
      return next({ status: 400, errors: `${key} should be string array` });
    }
    const objs = await repo.find({ where: { [column]: In(searchParams[key]) }, select: [column] });
    const validIds = new Set(objs.map((obj: any) => obj[column]));
    const invalidIds = searchParams[key].filter((id: any) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return next({ status: 400, errors: `Invalid ${key}: ${invalidIds.join(", ")}` });
    }
  }
}
