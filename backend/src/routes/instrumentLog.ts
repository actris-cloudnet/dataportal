import { DataSource, Repository } from "typeorm";
import { NextFunction, Request, RequestHandler } from "express";
import * as http from "http";
import { randomBytes, createHash } from "crypto";
import { basename } from "path";
import { InstrumentLog, InstrumentLogEventType } from "../entity/InstrumentLog";
import { InstrumentLogImage } from "../entity/InstrumentLogImage";
import { InstrumentInfo } from "../entity/Instrument";
import { UserAccount } from "../entity/UserAccount";
import { InstrumentLogPermissionType } from "../entity/InstrumentLogPermission";
import {
  notesRequiredEvents,
  notesRequiredDetails,
  notesRequiredResults,
  resultOptions,
} from "../../../shared/lib/entity/InstrumentLogConfig";
import { isValidDate, ssAuthString, getS3pathForLogImage } from "../lib";
import env from "../lib/env";

const VALID_EVENT_TYPES = Object.values(InstrumentLogEventType) as string[];
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES_PER_LOG = 5;

export class InstrumentLogRoutes {
  private logRepo: Repository<InstrumentLog>;
  private imageRepo: Repository<InstrumentLogImage>;
  private instrumentInfoRepo: Repository<InstrumentInfo>;
  private userRepo: Repository<UserAccount>;

  constructor(dataSource: DataSource) {
    this.logRepo = dataSource.getRepository(InstrumentLog);
    this.imageRepo = dataSource.getRepository(InstrumentLogImage);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.userRepo = dataSource.getRepository(UserAccount);
  }

  private async hasLogPermission(
    userId: number,
    permission: InstrumentLogPermissionType,
    instrumentInfoUuid: string,
  ): Promise<boolean> {
    return this.userRepo
      .createQueryBuilder("user")
      .leftJoin("user.instrumentLogPermissions", "ilp")
      .leftJoin("ilp.instrumentInfo", "instrumentInfo")
      .where("user.id = :userId", { userId })
      .andWhere("ilp.permission = :permission", { permission })
      .andWhere('("ilp"."instrumentInfoUuid" IS NULL OR "instrumentInfo"."uuid" = :uuid)', { uuid: instrumentInfoUuid })
      .getExists();
  }

  private async hasAnyLogPermission(
    userId: number,
    permissions: InstrumentLogPermissionType[],
    instrumentInfoUuid: string,
  ): Promise<boolean> {
    return this.userRepo
      .createQueryBuilder("user")
      .leftJoin("user.instrumentLogPermissions", "ilp")
      .leftJoin("ilp.instrumentInfo", "instrumentInfo")
      .where("user.id = :userId", { userId })
      .andWhere("ilp.permission IN (:...permissions)", { permissions })
      .andWhere('("ilp"."instrumentInfoUuid" IS NULL OR "instrumentInfo"."uuid" = :uuid)', { uuid: instrumentInfoUuid })
      .getExists();
  }

  private validateDates(date: any, endDate: any): string | null {
    if (!date || !isValidDate(date)) {
      return "date must be YYYY-MM-DD or YYYY-MM-DDTHH:mm";
    }
    if (new Date(date) > new Date()) {
      return "date cannot be in the future";
    }
    if (endDate != null) {
      if (!isValidDate(endDate)) {
        return "endDate must be YYYY-MM-DD or YYYY-MM-DDTHH:mm";
      }
      if (new Date(endDate) > new Date()) {
        return "endDate cannot be in the future";
      }
      if (new Date(endDate) < new Date(date)) {
        return "endDate cannot be before date";
      }
    }
    return null;
  }

  private validateBody(body: any): { error: string } | { allowedResults: string[] | undefined } {
    const { eventType, detail, result, date, endDate, notes } = body;
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return { error: `eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}` };
    }
    const allowedResults = resultOptions[eventType as keyof typeof resultOptions];
    if (allowedResults) {
      if (!result || !allowedResults.includes(result)) {
        return { error: `result must be one of: ${allowedResults.join(", ")}` };
      }
    }
    if (
      (notesRequiredEvents.has(eventType) || notesRequiredDetails.has(detail) || notesRequiredResults.has(result)) &&
      !notes?.trim()
    ) {
      return { error: "notes are required for this event type" };
    }
    const dateError = this.validateDates(date, endDate);
    if (dateError) {
      return { error: dateError };
    }
    return { allowedResults };
  }

  private async resolveInstrumentInfo(uuid?: string, pid?: string): Promise<InstrumentInfo | null> {
    if (uuid) return this.instrumentInfoRepo.findOneBy({ uuid });
    if (pid) return this.instrumentInfoRepo.findOneBy({ pid });
    return null;
  }

  private async findLogAndCheckPermission(req: Request, next: NextFunction): Promise<InstrumentLog | null> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      next({ status: 400, errors: "Invalid log entry id" });
      return null;
    }
    const log = await this.logRepo.findOneBy({ id });
    if (!log) {
      next({ status: 404, errors: "Log entry not found" });
      return null;
    }
    if (!req.user) {
      next({ status: 401, errors: "Unauthorized" });
      return null;
    }
    if (
      !(await this.hasLogPermission(req.user.id!, InstrumentLogPermissionType.canWriteLogs, log.instrumentInfoUuid))
    ) {
      next({ status: 403, errors: "Missing permission" });
      return null;
    }
    return log;
  }

  getLogs: RequestHandler = async (req, res, next) => {
    const { instrumentInfoUuid, instrumentPid } = req.query as { instrumentInfoUuid?: string; instrumentPid?: string };
    if (!instrumentInfoUuid && !instrumentPid) {
      return next({ status: 400, errors: "instrumentInfoUuid or instrumentPid is required" });
    }
    const instrumentInfo = await this.resolveInstrumentInfo(instrumentInfoUuid, instrumentPid);
    if (!instrumentInfo) {
      return next({ status: 404, errors: "Instrument not found" });
    }
    const uuid = instrumentInfo.uuid;
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    if (
      !(await this.hasAnyLogPermission(
        req.user.id!,
        [InstrumentLogPermissionType.canReadLogs, InstrumentLogPermissionType.canWriteLogs],
        uuid,
      ))
    ) {
      return next({ status: 403, errors: "Missing permission" });
    }
    const logs = await this.logRepo.find({
      where: { instrumentInfoUuid: uuid },
      relations: { userAccount: true },
      order: { date: "DESC", createdAt: "DESC" },
    });
    if (logs.length === 0) return res.json([]);
    const images = await this.imageRepo.find({
      where: logs.map((l) => ({ instrumentLogId: l.id })),
      select: ["id", "instrumentLogId", "filename", "size"],
    });
    const imagesByLogId = new Map<number, { id: number; filename: string; size: number }[]>();
    for (const img of images) {
      const list = imagesByLogId.get(img.instrumentLogId) ?? [];
      list.push({ id: img.id, filename: img.filename, size: img.size });
      imagesByLogId.set(img.instrumentLogId, list);
    }
    const safeEntries = logs.map(({ userAccount, ...rest }) => ({
      ...rest,
      images: imagesByLogId.get(rest.id) ?? [],
      createdBy: userAccount
        ? { id: userAccount.id, username: userAccount.username, fullName: userAccount.fullName }
        : null,
    }));
    res.json(safeEntries);
  };

  postLog: RequestHandler = async (req, res, next) => {
    const { instrumentInfoUuid, instrumentPid, eventType, detail, result, date, endDate, notes } = req.body;
    if (!instrumentInfoUuid && !instrumentPid) {
      return next({ status: 400, errors: "instrumentInfoUuid or instrumentPid is required" });
    }
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const instrumentInfo = await this.resolveInstrumentInfo(instrumentInfoUuid, instrumentPid);
    if (!instrumentInfo) {
      return next({ status: 404, errors: "Instrument not found" });
    }
    if (!(await this.hasLogPermission(req.user.id!, InstrumentLogPermissionType.canWriteLogs, instrumentInfo.uuid))) {
      return next({ status: 403, errors: "Missing permission" });
    }
    const validation = this.validateBody(req.body);
    if ("error" in validation) {
      return next({ status: 400, errors: validation.error });
    }
    const { allowedResults } = validation;
    const log = this.logRepo.create({
      instrumentInfo,
      instrumentInfoUuid: instrumentInfo.uuid,
      eventType,
      detail: detail ?? null,
      result: allowedResults ? result : null,
      date,
      endDate: endDate ?? null,
      notes: notes ?? null,
      userAccount: req.user ?? null,
    });
    const saved = await this.logRepo.save(log);
    res.status(201).json({
      id: saved.id,
      instrumentInfoUuid: saved.instrumentInfoUuid,
      eventType: saved.eventType,
      date: saved.date,
      detail: saved.detail,
      result: saved.result,
      endDate: saved.endDate,
      notes: saved.notes,
      userAccountId: saved.userAccountId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      images: [],
      createdBy: req.user ? { id: req.user.id!, username: req.user.username, fullName: req.user.fullName } : null,
    });
  };

  putLog: RequestHandler = async (req, res, next) => {
    const log = await this.findLogAndCheckPermission(req, next);
    if (!log) return;
    const validation = this.validateBody(req.body);
    if ("error" in validation) {
      return next({ status: 400, errors: validation.error });
    }
    const { allowedResults } = validation;
    const { eventType, detail, result, date, endDate, notes } = req.body;
    log.eventType = eventType;
    log.detail = detail ?? null;
    log.result = allowedResults ? result : null;
    log.date = date;
    log.endDate = endDate ?? null;
    log.notes = notes ?? null;
    const saved = await this.logRepo.save(log);
    res.json(saved);
  };

  deleteLog: RequestHandler = async (req, res, next) => {
    const log = await this.findLogAndCheckPermission(req, next);
    if (!log) return;
    await this.logRepo.delete({ id: log.id });
    res.sendStatus(204);
  };

  postImage: RequestHandler = async (req, res, next) => {
    const log = await this.findLogAndCheckPermission(req, next);
    if (!log) return;
    const contentType = req.headers["content-type"] ?? "";
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return next({ status: 400, errors: "Content-Type must be image/jpeg, image/png, or image/webp" });
    }
    const contentLength = parseInt(req.headers["content-length"] ?? "", 10);
    if (isNaN(contentLength) || contentLength <= 0) {
      return next({ status: 400, errors: "Content-Length header is required" });
    }
    if (contentLength > MAX_IMAGE_SIZE) {
      return next({ status: 400, errors: "Image must be smaller than 10 MB" });
    }
    const existingCount = await this.imageRepo.countBy({ instrumentLogId: log.id });
    if (existingCount >= MAX_IMAGES_PER_LOG) {
      return next({ status: 400, errors: `Maximum ${MAX_IMAGES_PER_LOG} images per log entry` });
    }
    const filename = basename(req.query.filename?.toString() ?? "image");
    const uniquePrefix = randomBytes(8).toString("hex");
    const s3key = `${log.instrumentInfoUuid}/${log.id}/${uniquePrefix}-${filename}`;
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      if (body.length > MAX_IMAGE_SIZE) {
        return next({ status: 400, errors: "Image must be smaller than 10 MB" });
      }
      const md5 = createHash("md5").update(body).digest("base64");
      const size = await this.putToS3(getS3pathForLogImage(s3key), body, md5);
      const image = this.imageRepo.create({ instrumentLogId: log.id, s3key, filename, size });
      const saved = await this.imageRepo.save(image);
      res.status(201).json({ id: saved.id, filename: saved.filename, size: saved.size });
    } catch (err: any) {
      return next({ status: 500, errors: "Failed to upload image" });
    }
  };

  getImage: RequestHandler = async (req, res, next) => {
    const logId = parseInt(req.params.id, 10);
    const imageId = parseInt(req.params.imageId, 10);
    if (isNaN(logId) || isNaN(imageId)) {
      return next({ status: 400, errors: "Invalid id" });
    }
    const image = await this.imageRepo.findOne({
      where: { id: imageId, instrumentLogId: logId },
      relations: { instrumentLog: true },
    });
    if (!image) {
      return next({ status: 404, errors: "Image not found" });
    }
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    if (
      !(await this.hasAnyLogPermission(
        req.user.id!,
        [InstrumentLogPermissionType.canReadLogs, InstrumentLogPermissionType.canWriteLogs],
        image.instrumentLog.instrumentInfoUuid,
      ))
    ) {
      return next({ status: 403, errors: "Missing permission" });
    }
    try {
      const upstreamRes = await this.getFromS3(getS3pathForLogImage(image.s3key));
      if (upstreamRes.statusCode !== 200) {
        res.status(upstreamRes.statusCode || 500);
        res.setHeader("Content-Type", "text/plain");
      } else {
        const ext = image.filename.split(".").pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        res.setHeader("Content-Type", mimeMap[ext ?? ""] ?? "application/octet-stream");
      }
      upstreamRes.pipe(res);
    } catch {
      return next({ status: 500, errors: "Failed to retrieve image" });
    }
  };

  deleteImage: RequestHandler = async (req, res, next) => {
    const log = await this.findLogAndCheckPermission(req, next);
    if (!log) return;
    const imageId = parseInt(req.params.imageId, 10);
    if (isNaN(imageId)) {
      return next({ status: 400, errors: "Invalid image id" });
    }
    const image = await this.imageRepo.findOneBy({ id: imageId, instrumentLogId: log.id });
    if (!image) {
      return next({ status: 404, errors: "Image not found" });
    }
    try {
      await this.deleteFromS3(getS3pathForLogImage(image.s3key));
    } catch {
      // Image may already be gone from S3, proceed with DB cleanup
    }
    await this.imageRepo.delete({ id: imageId });
    res.sendStatus(204);
  };

  private putToS3(s3path: string, body: Buffer, contentMd5: string): Promise<number> {
    const headers = {
      "Authorization": ssAuthString(),
      "Content-MD5": contentMd5,
      "Content-Length": body.length,
    };
    const requestOptions: http.RequestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: "PUT",
    };
    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, (response) => {
        let responseStr = "";
        response.on("data", (chunk: string) => (responseStr += chunk));
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 300) {
            return reject({ status: response.statusCode, errors: responseStr });
          }
          const responseJson = JSON.parse(responseStr);
          resolve(responseJson.size);
        });
      });
      req.on("error", (err) => reject({ status: 500, errors: err }));
      req.end(body);
    });
  }

  private getFromS3(s3path: string): Promise<http.IncomingMessage> {
    const headers = { Authorization: ssAuthString() };
    const requestOptions: http.RequestOptions = {
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

  private deleteFromS3(s3path: string): Promise<void> {
    const headers = { Authorization: ssAuthString() };
    const requestOptions: http.RequestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: "DELETE",
    };
    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, (response) => {
        response.resume();
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 300) {
            return reject({ status: response.statusCode });
          }
          resolve();
        });
      });
      req.on("error", (err) => reject({ status: 500, errors: err }));
      req.end();
    });
  }
}
