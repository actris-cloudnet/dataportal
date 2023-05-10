import { Site } from "../entity/Site";
import { InstrumentUpload, ModelUpload, Status, Upload } from "../entity/Upload";
import { Connection, EntitySchema, EntityTarget, Repository } from "typeorm";
import { NextFunction, Request, RequestHandler, Response } from "express";
import {
  dateforsize,
  fetchAll,
  getS3pathForUpload,
  isValidDate,
  ssAuthString,
  streamHandler,
  toArray,
  tomorrow,
  validateInstrumentPid,
} from "../lib";
import { basename } from "path";
import { ReducedMetadataResponse } from "../entity/ReducedMetadataResponse";
import validator from "validator";
import { Instrument } from "../entity/Instrument";
import { Model } from "../entity/Model";
import { ModelFile, RegularFile } from "../entity/File";
import * as http from "http";
import ReadableStream = NodeJS.ReadableStream;
import env from "../lib/env";

export class UploadRoutes {
  constructor(conn: Connection) {
    this.conn = conn;
    this.instrumentUploadRepo = this.conn.getRepository(InstrumentUpload);
    this.modelUploadRepo = this.conn.getRepository(ModelUpload);
    this.instrumentRepo = this.conn.getRepository(Instrument);
    this.modelRepo = this.conn.getRepository(Model);
    this.siteRepo = this.conn.getRepository(Site);
    this.modelFileRepo = this.conn.getRepository(ModelFile);
    this.regularFileRepo = this.conn.getRepository(RegularFile);
  }

  readonly conn: Connection;
  readonly instrumentUploadRepo: Repository<InstrumentUpload>;
  readonly modelUploadRepo: Repository<ModelUpload>;
  readonly instrumentRepo: Repository<Instrument>;
  readonly siteRepo: Repository<Site>;
  readonly modelRepo: Repository<Model>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly regularFileRepo: Repository<RegularFile>;

  postMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    const filename = basename(body.filename);
    let UploadEntity: EntityTarget<InstrumentUpload | ModelUpload>;
    const instrumentUpload = "instrument" in body;
    let dataSource: any;
    let uploadedMetadata;
    let sortedTags = [] as string[];

    try {
      const site = await this.siteRepo.findOne(req.params.site);
      if (site == undefined) {
        return next({ status: 422, errors: "Unknown site" });
      }
      if (instrumentUpload) {
        dataSource = await this.instrumentRepo.findOne(body.instrument);
        if (dataSource == undefined) {
          return next({ status: 422, errors: "Unknown instrument" });
        }
        UploadEntity = InstrumentUpload;

        const allowedTags = new Set((dataSource as Instrument).allowedTags);
        const metadataTags = new Set(body.tags as string[]);
        sortedTags = Array.from(metadataTags)
          .filter((x) => allowedTags.has(x))
          .sort();
        if (metadataTags.size != sortedTags.length) {
          return next({ status: 422, errors: "Unknown tag" });
        }
      } else {
        dataSource = await this.modelRepo.findOne(body.model);
        if (dataSource == undefined) {
          return next({ status: 422, errors: "Unknown model" });
        }
        UploadEntity = ModelUpload;
      }

      const result = await this.conn.transaction(async (transactionalEntityManager) => {
        // First search row by checksum.
        const uploadByChecksum = await transactionalEntityManager.findOne(UploadEntity, { checksum: body.checksum });
        if (uploadByChecksum) {
          if (uploadByChecksum.status === Status.CREATED) {
            // Remove the existing row so that we can insert or update a row
            // with the same checksum.
            await transactionalEntityManager.remove(UploadEntity, uploadByChecksum);
          } else {
            return { status: 409, errors: "File already uploaded" };
          }
        }

        // Secondly search row by other unique columns.
        const params = { site: site, measurementDate: body.measurementDate, filename: filename };
        const payload = instrumentUpload
          ? { ...params, instrument: body.instrument, tags: sortedTags }
          : { ...params, model: body.model };

        // If a matching row exists, update it.
        const uploadByParams = await transactionalEntityManager.findOne<InstrumentUpload | ModelUpload>(
          UploadEntity,
          payload
        );
        if (uploadByParams) {
          await transactionalEntityManager.update(UploadEntity, uploadByParams.uuid, {
            checksum: body.checksum,
            updatedAt: new Date(),
            status: Status.CREATED,
          });
          return { status: 200 };
        }

        // If no matching row was found, insert a new one.
        const args = { ...params, checksum: body.checksum, status: Status.CREATED };
        if (instrumentUpload) {
          uploadedMetadata = new InstrumentUpload(
            args,
            dataSource as Instrument,
            body.instrumentPid,
            sortedTags as Array<string>
          );
        } else {
          uploadedMetadata = new ModelUpload(args, dataSource as Model);
        }
        await transactionalEntityManager.insert(UploadEntity, uploadedMetadata);
        return { status: 200 };
      });

      if (result.status >= 200 && result.status < 300) {
        res.sendStatus(result.status);
      } else {
        next(result);
      }
    } catch (err: any) {
      console.error("Unknown error", err);
      return next({ status: 500, errors: `Internal server error: ${err.code}` });
    }
  };

  updateMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const partialUpload = req.body;
    if (!partialUpload.uuid) return next({ status: 422, errors: "Request body is missing uuid" });
    try {
      const upload = await this.findAnyUpload((repo, model) =>
        repo.findOne({ uuid: partialUpload.uuid }, { relations: ["site", model ? "model" : "instrument"] })
      );
      if (!upload) return next({ status: 422, errors: "No file matches the provided uuid" });
      await this.findRepoForUpload(upload).update({ uuid: partialUpload.uuid }, partialUpload);
      res.sendStatus(200);
    } catch (err: any) {
      console.error("Unknown error", err);
      return next({ status: 500, errors: `Internal server error: ${err.code}` });
    }
  };

  metadata: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum;
    this.findAnyUpload((repo, model) =>
      repo.findOne({ checksum: checksum }, { relations: ["site", model ? "model" : "instrument"] })
    )
      .then((upload) => {
        if (upload == undefined) return next({ status: 404, errors: "No metadata was found with provided id" });
        res.send(this.augmentUploadResponse(true)(upload));
      })
      .catch((err: any) => {
        console.error("Unknown error", err);
        next({ status: 500, errors: `Internal server error: ${err.code}` });
      });
  };

  listMetadata = (includeS3path: boolean) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const isModel = req.path.includes("model");
      const repo = isModel ? this.modelUploadRepo : this.instrumentUploadRepo;
      this.metadataStream(repo, req.query, false, isModel)
        .then((uploadedMetadata) => {
          streamHandler(uploadedMetadata, res, "um", this.augmentUploadResponse(includeS3path));
        })
        .catch((err: any) => {
          console.error("Unknown error", err);
          next({ status: 500, errors: `Internal server error: ${err.code}` });
        });
    };
  };

  listInstrumentsFromMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const instrumentUploads = (await this.metadataMany(
        this.instrumentUploadRepo,
        req.query,
        true
      )) as InstrumentUpload[];
      const reducedMetadataResponses = instrumentUploads.map((md) => new ReducedMetadataResponse(md));
      res.send(reducedMetadataResponses);
    } catch (error) {
      next({ status: 500, errors: error });
    }
  };

  putData: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum;
    const site = req.params.site;
    try {
      const upload = await this.findAnyUpload((repo, model) =>
        repo.findOne({
          where: { checksum: checksum, site: { id: site } },
          relations: ["site", model ? "model" : "instrument"],
        })
      );
      if (!upload) return next({ status: 400, errors: "No metadata matches this hash" });
      if (upload.status != Status.CREATED) return res.sendStatus(200); // Already uploaded

      const { status, body } = await this.makeRequest(getS3pathForUpload(upload), checksum, req);

      await this.findRepoForUpload(upload).update(
        { checksum: checksum },
        { status: Status.UPLOADED, updatedAt: new Date(), size: body.size }
      );
      res.sendStatus(status);
    } catch (err: any) {
      if (err.status == 400 && err.errors == "Checksum does not match file contents") return next(err); // Client error
      if (err.errors)
        // Our error
        return next({ status: 500, errors: `Internal server error: ${err.errors}` });
      console.error("Unknown error", err);
      return next({ status: 500, errors: `Internal server error: ${err.code}` }); // Unknown error
    }
  };

  private async makeRequest(
    s3path: string,
    checksum: string,
    inputStream: ReadableStream
  ): Promise<{ status: number; body: any }> {
    const headers = {
      Authorization: ssAuthString(),
      "Content-MD5": Buffer.from(checksum, "hex").toString("base64"),
    };

    const requestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: "PUT",
    };

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, (response) => {
        let responseStr = "";
        response.on("data", (chunk) => (responseStr += chunk));
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 300)
            return reject({ status: response.statusCode, errors: responseStr });
          const responseJson = JSON.parse(responseStr);
          resolve({ status: response.statusCode as number, body: responseJson });
        });
      });
      req.on("error", (err) => reject({ status: 500, errors: err }));
      inputStream.pipe(req, { end: true });
    });
  }

  private async metadataQueryBuilder(
    repo: Repository<InstrumentUpload | ModelUpload>,
    query: any,
    onlyDistinctInstruments = false,
    model = false
  ) {
    const augmentedQuery: any = {
      site: query.site || (await fetchAll<Site>(this.conn, Site)).map((site) => site.id),
      status: query.status || [Status.UPLOADED, Status.CREATED, Status.PROCESSED, Status.INVALID],
      dateFrom: query.dateFrom || "1970-01-01",
      dateTo: query.dateTo || tomorrow(),
      instrument: model ? undefined : query.instrument,
      model: model ? query.model : undefined,
      updatedAtFrom: query.updatedAtFrom ? new Date(query.updatedAtFrom) : "1970-01-01T00:00:00.000Z",
      updatedAtTo: query.updatedAtTo ? new Date(query.updatedAtTo) : tomorrow(),
    };

    const fieldsToArray = ["site", "status", "instrument", "model"];
    fieldsToArray.forEach((element) => (augmentedQuery[element] = toArray(augmentedQuery[element])));

    const qb = repo.createQueryBuilder("um");
    qb.leftJoinAndSelect("um.site", "site");
    if (!model) {
      qb.leftJoinAndSelect("um.instrument", "instrument");
      if (onlyDistinctInstruments) qb.distinctOn(["instrument.id", "um.instrumentPid"]);
    } else {
      qb.leftJoinAndSelect("um.model", "model");
    }
    qb.where("um.measurementDate >= :dateFrom AND um.measurementDate <= :dateTo", augmentedQuery)
      .andWhere("um.updatedAt >= :updatedAtFrom AND um.updatedAt <= :updatedAtTo", augmentedQuery)
      .andWhere("site.id IN (:...site)", augmentedQuery)
      .andWhere("um.status IN (:...status)", augmentedQuery);
    if (query.instrument) qb.andWhere("instrument.id IN (:...instrument)", augmentedQuery);
    if (query.model) qb.andWhere("model.id IN (:...model)", augmentedQuery);

    if (!onlyDistinctInstruments) qb.addOrderBy("size", "DESC");

    return qb;
  }

  private async metadataStream(
    repo: Repository<InstrumentUpload | ModelUpload>,
    query: any,
    onlyDistinctInstruments = false,
    model = false
  ) {
    const qb = await this.metadataQueryBuilder(repo, query, onlyDistinctInstruments, model);
    return qb.stream();
  }

  private async metadataMany(
    repo: Repository<InstrumentUpload | ModelUpload>,
    query: any,
    onlyDistinctInstruments = false,
    model = false
  ) {
    const qb = await this.metadataQueryBuilder(repo, query, onlyDistinctInstruments, model);
    return qb.getMany();
  }

  private getDownloadPathForUpload = (file: Upload) => `raw/${file.uuid}/${file.filename}`;

  private augmentUploadResponse = (includeS3Path: boolean) => (upload: InstrumentUpload | ModelUpload) => ({
    ...upload,
    ...{
      downloadUrl: `${env.DP_BACKEND_URL}/download/${this.getDownloadPathForUpload(upload)}`,
      s3path: includeS3Path ? getS3pathForUpload(upload) : undefined,
    },
  });

  validateMetadata: RequestHandler = async (req, res, next) => {
    const body = req.body;
    if (!("filename" in body) || !body.filename) {
      return next({ status: 422, errors: "Request is missing filename" });
    }
    if (!("checksum" in body) || !validator.isMD5(body.checksum)) {
      return next({ status: 422, errors: "Request is missing checksum or checksum is invalid" });
    }
    if (!("measurementDate" in body) || !body.measurementDate || !isValidDate(body.measurementDate)) {
      return next({ status: 422, errors: "Request is missing measurementDate or measurementDate is invalid" });
    }
    if (this.isFutureDate(body.measurementDate)) {
      return next({ status: 422, errors: "MeasurementDate is in the future" });
    }
    if (req.path.includes("model")) {
      if (!("model" in body && body.model)) return next({ status: 422, errors: "Request is missing model" });
    } else {
      if (!("instrument" in body && body.instrument))
        return next({ status: 422, errors: "Request is missing instrument" });
    }
    if ("instrument" in body && "model" in body) {
      return next({
        status: 422,
        errors: 'Both "instrument" and "model" fields may not be specified',
      });
    }
    if (!("instrument" in body || "model" in body)) {
      return next({
        status: 422,
        errors: 'Metadata must have either "instrument" or "model" field',
      });
    }
    if ("instrument" in body) {
      if (!("instrumentPid" in body) || !body.instrumentPid) {
        return next({ status: 422, errors: "Request is missing instrumentPid" });
      }
      const error = validateInstrumentPid(body.instrumentPid);
      if (error) {
        return next({ status: 422, errors: `instrumentPid ${error}` });
      }
    }
    if ("tags" in body) {
      if (Array.isArray(body.tags)) {
        if (!body.tags.every((tag: any) => typeof tag === "string")) {
          return next({
            status: 422,
            errors: "Metadata tags must be strings",
          });
        }
      } else {
        return next({
          status: 422,
          errors: "Metadata tags must be given as an array",
        });
      }
    }
    return next();
  };

  isFutureDate(measurementDate: string): boolean {
    const referenceDate = new Date();
    const howManyDaysOKToBeInFuture = 5;
    referenceDate.setDate(referenceDate.getDate() + howManyDaysOKToBeInFuture);
    return new Date(measurementDate) > referenceDate;
  }

  validateFilename: RequestHandler = async (req, res, next) => {
    const filename = req.body.filename;
    const validFilenamePattern = /^(.*\/)?(?=[a-zA-Z\d])([-_.a-zA-Z\d]*[a-zA-Z\d])$/;
    const isValid = validFilenamePattern.test(filename);
    if (!isValid) return next({ status: 422, errors: `Filename contains forbidden characters: ${filename}` });
    if (filename.includes("/"))
      console.log(`Warning: filename contains slashes (site: ${req.params.site}, filename: ${filename})`);
    return next();
  };

  findAnyUpload(
    searchFunc: (
      arg0: Repository<ModelUpload | InstrumentUpload>,
      arg1?: boolean
    ) => Promise<ModelUpload | InstrumentUpload | undefined>
  ): Promise<ModelUpload | InstrumentUpload | undefined> {
    return Promise.all([searchFunc(this.instrumentUploadRepo, false), searchFunc(this.modelUploadRepo, true)]).then(
      ([upload, modelUpload]) => upload || modelUpload
    );
  }

  dateforsize: RequestHandler = async (req, res, next) => {
    const isModel = "model" in req.query;
    return dateforsize(
      isModel ? this.modelUploadRepo : this.instrumentUploadRepo,
      isModel ? "model_upload" : "instrument_upload",
      req,
      res,
      next
    );
  };

  findRepoForUpload(upload: InstrumentUpload | ModelUpload) {
    return "instrument" in upload ? this.instrumentUploadRepo : this.modelUploadRepo;
  }
}
