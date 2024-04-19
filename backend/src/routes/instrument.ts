import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { Instrument, InstrumentInfo } from "../entity/Instrument";
import { InstrumentUpload } from "../entity/Upload";

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.instrumentRepo = dataSource.getRepository(Instrument);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
  }

  readonly dataSource: DataSource;
  readonly instrumentRepo: Repository<Instrument>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly instrumentUploadRepo: Repository<InstrumentUpload>;

  instruments: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const instruments = await this.instrumentRepo.find({ order: { type: "ASC", id: "ASC" } });
      res.send(instruments);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  listInstrumentPids: RequestHandler = async (req, res, next) => {
    try {
      if ("includeSite" in req.query) {
        const latestSite = this.instrumentUploadRepo
          .createQueryBuilder("upload")
          .distinctOn(["upload.instrumentInfoUuid"])
          .select("upload.instrumentInfoUuid")
          .addSelect("upload.siteId")
          .addSelect(
            `CASE
               WHEN upload.measurementDate > CURRENT_DATE - 3 THEN 'active'
               WHEN upload.measurementDate > CURRENT_DATE - 7 THEN 'recent'
               ELSE 'inactive'
             END`,
            "status",
          )
          .where("upload.measurementDate > CURRENT_DATE - 182")
          .orderBy("upload.instrumentInfoUuid")
          .addOrderBy("upload.measurementDate", "DESC")
          .getQuery();
        const rawData = await this.instrumentInfoRepo
          .createQueryBuilder("instrument_info")
          .select(["instrument_info.*", "latest_site.*"])
          .leftJoin("(" + latestSite + ")", "latest_site", 'instrument_info.uuid = latest_site."instrumentInfoUuid"')
          .leftJoinAndSelect(Instrument, "instrument", "instrument_info.instrumentId = instrument.id")
          .getRawMany();
        const data = rawData.map((row) => ({
          uuid: row.uuid,
          pid: row.pid,
          name: row.name,
          owners: row.owners,
          model: row.model,
          type: row.type,
          serialNumber: row.serialNumber,
          siteId: row.siteId,
          status: row.status,
          instrument: {
            id: row.instrument_id,
            type: row.instrument_type,
            humanReadableName: row.instrument_humanReadableName,
            shortName: row.instrument_shortName,
            allowedTags: row.instrument_allowedTags,
          },
        }));
        res.send(data);
      } else {
        const data = await this.instrumentInfoRepo.find({ relations: { instrument: true } });
        res.send(data);
      }
    } catch (error) {
      next({ status: 500, errors: error });
    }
  };

  instrumentPid: RequestHandler = async (req, res, next) => {
    try {
      const pid = await this.instrumentInfoRepo.findOne({
        where: { uuid: req.params.uuid },
        relations: { instrument: true },
      });
      if (!pid) {
        return next({ status: 404, errors: ["No instrument PID match this id"] });
      }
      const locations = await this.dataSource.query(
        `WITH dates AS (
          SELECT
            "siteId",
            "measurementDate",
            LAG("measurementDate") OVER (PARTITION BY "siteId" ORDER BY "measurementDate") AS "prevDate"
          FROM regular_file
          WHERE "instrumentPid" = $1
        ), gaps AS (
          SELECT
            "siteId",
            "measurementDate",
            CASE
              WHEN "prevDate" IS NULL OR "measurementDate" - "prevDate" > 30 THEN 1
              ELSE 0
            END AS "isNewPeriod"
          FROM dates
        ), periods AS (
          SELECT
            "siteId",
            "measurementDate",
            SUM("isNewPeriod") OVER (ORDER BY "measurementDate") AS "periodId"
          FROM gaps
        )
        SELECT
          "siteId",
          "humanReadableName",
          MIN("measurementDate")::text AS "startDate",
          MAX("measurementDate")::text AS "endDate"
        FROM periods
        JOIN site ON "siteId" = site.id
        GROUP BY "siteId", "humanReadableName", "periodId"
        ORDER BY "startDate" DESC;`,
        [pid.pid],
      );
      res.send({ ...pid, locations });
    } catch (error) {
      next({ status: 500, errors: error });
    }
  };
}
