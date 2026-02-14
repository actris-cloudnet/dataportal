import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";
import { InstrumentLog, InstrumentLogEventType } from "../entity/InstrumentLog";
import { InstrumentInfo } from "../entity/Instrument";
import { isValidDate } from "../lib";

const VALID_EVENT_TYPES = Object.values(InstrumentLogEventType) as string[];

export class InstrumentLogRoutes {
  private logRepo: Repository<InstrumentLog>;
  private instrumentInfoRepo: Repository<InstrumentInfo>;

  constructor(dataSource: DataSource) {
    this.logRepo = dataSource.getRepository(InstrumentLog);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
  }

  getLogs: RequestHandler = async (req, res, next) => {
    const { instrumentInfoUuid } = req.query as { instrumentInfoUuid?: string };
    if (!instrumentInfoUuid) {
      return next({ status: 400, errors: "instrumentInfoUuid is required" });
    }
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: instrumentInfoUuid });
    if (!instrumentInfo) {
      return next({ status: 404, errors: "Instrument not found" });
    }
    const logs = await this.logRepo.find({
      where: { instrumentInfoUuid },
      relations: { userAccount: true },
      order: { date: "DESC", createdAt: "DESC" },
    });
    const safeEntries = logs.map(({ userAccount, ...rest }) => ({
      ...rest,
      createdBy: userAccount
        ? { id: userAccount.id, username: userAccount.username, fullName: userAccount.fullName }
        : null,
    }));
    res.json(safeEntries);
  };

  postLog: RequestHandler = async (req, res, next) => {
    const { instrumentInfoUuid, eventType, date, notes } = req.body;
    if (!instrumentInfoUuid) {
      return next({ status: 400, errors: "instrumentInfoUuid is required" });
    }
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return next({ status: 400, errors: `eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}` });
    }
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(date);
    if (!date || (!dateOnly && !dateTime)) {
      return next({ status: 400, errors: "date must be YYYY-MM-DD or YYYY-MM-DDTHH:mm" });
    }
    if (new Date(date) > new Date()) {
      return next({ status: 400, errors: "date cannot be in the future" });
    }
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: instrumentInfoUuid });
    if (!instrumentInfo) {
      return next({ status: 404, errors: "Instrument not found" });
    }
    const log = this.logRepo.create({
      instrumentInfo,
      instrumentInfoUuid,
      eventType,
      date,
      notes: notes ?? null,
      userAccount: req.user ?? null,
    });
    const saved = await this.logRepo.save(log);
    res.status(201).json(saved);
  };

  deleteLog: RequestHandler = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return next({ status: 400, errors: "Invalid log entry id" });
    }
    const log = await this.logRepo.findOneBy({ id });
    if (!log) {
      return next({ status: 404, errors: "Log entry not found" });
    }
    await this.logRepo.delete({ id });
    res.sendStatus(204);
  };
}
