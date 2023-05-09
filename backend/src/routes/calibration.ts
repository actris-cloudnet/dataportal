import { Connection, LessThanOrEqual, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";
import { Calibration } from "../entity/Calibration";
import { isValidDate, validateInstrumentPid } from "../lib";

export class CalibrationRoutes {
  constructor(conn: Connection) {
    this.calibRepo = conn.getRepository<Calibration>("calibration");
  }

  private calibRepo: Repository<Calibration>;

  validateParams: RequestHandler = async (req: Request, res: Response, next) => {
    if (!("date" in req.query) || !("instrumentPid" in req.query)) {
      return next({ status: 400, errors: "Following parameters must all be specified: date, instrumentPid" });
    }
    if (!isValidDate(req.query.date)) {
      return next({ status: 400, errors: "date is invalid" });
    }
    const instrumentPidError = validateInstrumentPid(req.query.instrumentPid);
    if (instrumentPidError) {
      return next({ status: 400, errors: `instrumentPid ${instrumentPidError}` });
    }
    next();
  };

  calibration: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const calib = await this.calibRepo.findOne({
        where: {
          instrumentPid: req.query.instrumentPid,
          measurementDate: LessThanOrEqual(req.query.date),
        },
        order: { measurementDate: "DESC" },
      });
      if (!calib) {
        return next({ status: 404, errors: "Calibration data not found" });
      }
      res.send({
        createdAt: calib.createdAt,
        updatedAt: calib.updatedAt,
        data: calib.data,
      });
    } catch (e) {
      next({ status: 500, errors: e });
    }
  };

  putCalibration: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const calib = new Calibration();
      calib.instrumentPid = req.query.instrumentPid as string;
      calib.measurementDate = req.query.date as string;
      calib.data = req.body;
      await this.calibRepo.save(calib);
      return res.sendStatus(200);
    } catch (err) {
      return next({ status: 500, errors: err });
    }
  };
}
