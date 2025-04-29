import { DataSource, LessThanOrEqual, Repository } from "typeorm";
import { RequestHandler } from "express";
import { Calibration } from "../entity/Calibration";
import { isValidDate, validateInstrumentPid } from "../lib";
import { InstrumentInfo } from "../entity/Instrument";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

interface QueryParams {
  date: string;
  instrumentPid: string;
}

export class CalibrationRoutes {
  constructor(dataSource: DataSource) {
    this.calibRepo = dataSource.getRepository(Calibration);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
  }

  private calibRepo: Repository<Calibration>;
  private instrumentInfoRepo: Repository<InstrumentInfo>;

  calibration: RequestHandler = async (req, res, next) => {
    const query = req.query as unknown as QueryParams;

    if (!query.instrumentPid) {
      return next({ status: 400, errors: "instrumentPid is missing" });
    }
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ pid: query.instrumentPid });
    if (!instrumentInfo) {
      return next({ status: 404, errors: "Instrument not found" });
    }

    if (query.date) {
      if (!isValidDate(query.date)) {
        return next({ status: 400, errors: "date is invalid" });
      }
      const calib = await fetchCalibration(this.calibRepo, instrumentInfo, query.date);
      if (!calib) {
        return next({ status: 404, errors: "Calibration data not found" });
      }
      res.send(calib);
    } else {
      const calib = await this.calibRepo.find({
        where: { instrumentInfo: { pid: query.instrumentPid } },
        order: { measurementDate: "ASC" },
      });
      if (!calib || calib.length === 0) {
        return next({ status: 404, errors: "Calibration data not found" });
      }
      const output: any = {};
      for (const c of calib) {
        if (!(c.key in output)) {
          output[c.key] = [];
        }
        output[c.key].push({
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          measurementDate: c.measurementDate,
          data: c.data,
        });
      }
      res.send(output);
    }
  };

  putCalibration: RequestHandler = async (req, res, next) => {
    const query = req.query as any;
    if (!query.instrumentPid) {
      return next({ status: 400, errors: "instrumentPid is missing" });
    }
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ pid: query.instrumentPid });
    if (!instrumentInfo) {
      return next({ status: 400, errors: "Instrument not found" });
    }
    const now = new Date();
    await this.calibRepo
      .createQueryBuilder("calib")
      .insert()
      .values(
        Object.entries(req.body).map(
          ([key, data]): QueryDeepPartialEntity<Calibration> => ({
            instrumentInfo,
            measurementDate: query.date,
            key,
            data: data as any,
            createdAt: now,
            updatedAt: now,
          }),
        ),
      )
      .orUpdate(["data", "updatedAt"], ["instrumentInfoUuid", "measurementDate", "key"])
      .execute();
    res.sendStatus(200);
  };
}

export async function fetchCalibration(
  calibRepo: Repository<Calibration>,
  instrumentInfo: InstrumentInfo,
  date: string,
): Promise<Record<string, any> | null> {
  const rows = await calibRepo
    .createQueryBuilder("calib")
    .distinctOn(["calib.instrumentInfoUuid", "calib.key"])
    .where("calib.instrumentInfoUuid = :uuid", { uuid: instrumentInfo.uuid })
    .andWhere("calib.measurementDate <= :date", { date })
    .orderBy("calib.instrumentInfoUuid")
    .addOrderBy("calib.key")
    .addOrderBy("calib.measurementDate", "DESC")
    .getMany();
  if (rows.length === 0) {
    return null;
  }
  return { data: Object.fromEntries(rows.map((row) => [row.key, row.data])) };
}
