import { DataSource, LessThanOrEqual, Repository } from "typeorm";
import { RequestHandler } from "express";
import { Calibration } from "../entity/Calibration";
import { isValidDate, validateInstrumentPid } from "../lib";

interface QueryParams {
  date: string;
  instrumentPid: string;
}

export class CalibrationRoutes {
  constructor(dataSource: DataSource) {
    this.calibRepo = dataSource.getRepository(Calibration);
  }

  private calibRepo: Repository<Calibration>;

  validateParams: RequestHandler = (req, res, next) => {
    if (!("instrumentPid" in req.query)) {
      return next({ status: 400, errors: "Parameter instrumentPid must be specified" });
    }
    const instrumentPidError = validateInstrumentPid(req.query.instrumentPid);
    if (instrumentPidError) {
      return next({ status: 400, errors: `instrumentPid ${instrumentPidError}` });
    }
    next();
  };

  calibration: RequestHandler = async (req, res, next) => {
    const query = req.query as unknown as QueryParams;
    if (query.date) {
      if (!isValidDate(query.date)) {
        return next({ status: 400, errors: "date is invalid" });
      }
      const calib = await fetchCalibration(this.calibRepo, query.instrumentPid, query.date);
      if (!calib) {
        return next({ status: 404, errors: "Calibration data not found" });
      }
      res.send(calib);
    } else {
      const calib = await this.calibRepo.find({
        where: {
          instrumentPid: query.instrumentPid,
        },
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
      // res.send(Object.entries(output).map(([key, data]) => ({ key, data })));
    }
  };

  putCalibration: RequestHandler = async (req, res) => {
    const query = req.query as any;
    for (const [key, data] of Object.entries(req.body)) {
      const calib = new Calibration();
      calib.instrumentPid = query.instrumentPid;
      calib.measurementDate = query.date;
      calib.key = key;
      calib.data = data;
      await this.calibRepo.save(calib);
    }
    res.sendStatus(200);
  };
}

export async function fetchCalibration(
  calibRepo: Repository<Calibration>,
  instrumentPid: string,
  date: string,
): Promise<Record<string, any> | null> {
  const rows = await calibRepo
    .createQueryBuilder("calib")
    .distinctOn(["calib.instrumentPid", "calib.key"])
    .where("calib.instrumentPid = :instrumentPid", { instrumentPid })
    .andWhere("calib.measurementDate <= :date", { date })
    .orderBy("calib.instrumentPid")
    .addOrderBy("calib.key")
    .addOrderBy("calib.measurementDate", "DESC")
    .getMany();
  if (rows.length === 0) {
    return null;
  }
  return { data: Object.fromEntries(rows.map((row) => [row.key, row.data])) };
}
