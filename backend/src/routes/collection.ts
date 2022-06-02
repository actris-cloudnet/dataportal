import { Request, RequestHandler, Response } from "express";
import { Collection } from "../entity/Collection";
import { CollectionResponse } from "../entity/CollectionResponse";
import { validate as validateUuid } from "uuid";
import axios from "axios";
import { Connection, Repository } from "typeorm";
import { File, ModelFile, RegularFile } from "../entity/File";
import { convertToSearchResponse } from "../lib";
import env from "../lib/env";

export class CollectionRoutes {
  constructor(conn: Connection) {
    this.conn = conn;
    this.collectionRepo = conn.getRepository<Collection>("collection");
    this.fileRepo = conn.getRepository<RegularFile>("regular_file");
    this.modelFileRepo = conn.getRepository<ModelFile>("model_file");
  }

  readonly conn: Connection;
  readonly collectionRepo: Repository<Collection>;
  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;

  postCollection: RequestHandler = async (req: Request, res: Response, next) => {
    if (!("files" in req.body) || !req.body.files || !Array.isArray(req.body.files)) {
      next({ status: 422, errors: ['Request is missing field "files"'] });
      return;
    }
    const fileUuids: string[] = req.body.files;
    try {
      const [files, modelFiles] = await Promise.all([
        this.fileRepo.findByIds(fileUuids),
        this.modelFileRepo.findByIds(fileUuids),
      ]);
      if ((files as unknown as File[]).concat(modelFiles).length != fileUuids.length) {
        const existingUuids = files.map((file) => file.uuid);
        const missingFiles = fileUuids.filter((uuid) => !existingUuids.includes(uuid));
        return next({ status: 422, errors: [`Following files do not exist: ${missingFiles}`] });
      }
      const collection = await this.collectionRepo.save(new Collection(files, modelFiles));
      res.send(collection.uuid);
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  collection: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid: string = req.params.uuid;
    try {
      const collection = await this.findCollection(uuid);
      if (!collection) return next({ status: 404, errors: ["Collection not found"] });

      res.send(new CollectionResponse(collection));
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  generatePid: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    if (!body.uuid || !body.type || !validateUuid(body.uuid)) {
      return next({ status: 422, errors: ["Missing or invalid uuid or type"] });
    }
    if (body.type != "collection") {
      return next({ status: 422, errors: ["Type must be collection"] });
    }
    try {
      const collection = await this.collectionRepo.findOne(body.uuid);
      if (collection === undefined) return next({ status: 422, errors: ["Collection not found"] });
      if (collection.pid) return next({ status: 403, errors: ["Collection already has a PID"] });
      const pidRes = await axios.post(env.DP_PID_SERVICE_URL, req.body, { timeout: env.DP_PID_SERVICE_TIMEOUT_MS });
      await this.collectionRepo.update({ uuid: body.uuid }, { pid: pidRes.data.pid });
      res.send(pidRes.data);
    } catch (e) {
      if (e.code == "ECONNABORTED") return next({ status: 504, errors: ["PID service took too long to respond"] });
      return next({ status: 500, errors: e });
    }
  };

  allcollections: RequestHandler = async (req: Request, res: Response, next) =>
    this.collectionRepo
      .find({
        relations: [
          "regularFiles",
          "regularFiles.site",
          "regularFiles.product",
          "modelFiles",
          "modelFiles.site",
          "modelFiles.product",
        ],
      })
      .then((collections) => {
        const response = collections.map((coll) => ({
          ...coll,
          ...{ files: coll.regularFiles.map(convertToSearchResponse) },
        }));
        res.send(response);
      })
      .catch((err) => next({ status: 500, errors: err }));

  public async findCollection(uuid: string) {
    const collection = await this.collectionRepo.findOne(uuid);
    if (!collection) return undefined;
    const regularFileIds = await this.collectionRepo.query(
      'SELECT "regularFileUuid" from collection_regular_files_regular_file WHERE "collectionUuid" = $1',
      [uuid]
    );
    const regularFiles = await this.fileRepo.findByIds(
      regularFileIds.map((obj: any) => obj.regularFileUuid),
      { relations: ["site", "product"] }
    );

    const modelFileIds = await this.collectionRepo.query(
      'SELECT "modelFileUuid" from collection_model_files_model_file WHERE "collectionUuid" = $1',
      [uuid]
    );
    const modelFiles = await this.modelFileRepo.findByIds(
      modelFileIds.map((obj: any) => obj.modelFileUuid),
      { relations: ["site", "product", "model"] }
    );
    return { ...collection, regularFiles, modelFiles } as Collection;
  }
}
