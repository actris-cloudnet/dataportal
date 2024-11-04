import { DataSource, LessThanOrEqual, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";
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

  validateParams: RequestHandler = (req: Request, res: Response, next) => {
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
      res.send({
        createdAt: calib.createdAt,
        updatedAt: calib.updatedAt,
        measurementDate: calib.measurementDate,
        data: calib.data,
      });
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

      res.send(
        calib.map((c) => ({
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          measurementDate: c.measurementDate,
          data: c.data,
        })),
      );
    }
  };

  putCalibration: RequestHandler = async (req, res, next) => {
    const query = req.query as unknown as QueryParams;
    const calib = new Calibration();
    calib.instrumentPid = query.instrumentPid;
    calib.measurementDate = query.date;
    calib.data = req.body;
    await this.calibRepo.save(calib);
    res.sendStatus(200);
  };
}

export async function fetchCalibration(
  calibRepo: Repository<Calibration>,
  instrumentPid: string,
  date: string,
): Promise<Calibration | null> {
  return await calibRepo.findOne({
    where: {
      instrumentPid: instrumentPid,
      measurementDate: LessThanOrEqual(date),
    },
    order: { measurementDate: "DESC" },
  });
}
