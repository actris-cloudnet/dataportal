import { RequestHandler } from "express";
import { DataSource, LessThanOrEqual, Repository } from "typeorm";
import { Instrument, InstrumentInfo, NominalInstrument } from "../entity/Instrument";
import { InstrumentUpload } from "../entity/Upload";
import { isValidDate } from "../lib";

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.instrumentRepo = dataSource.getRepository(Instrument);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
    this.nominalInstrumentRepo = dataSource.getRepository(NominalInstrument);
  }

  readonly dataSource: DataSource;
  readonly instrumentRepo: Repository<Instrument>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly instrumentUploadRepo: Repository<InstrumentUpload>;
  readonly nominalInstrumentRepo: Repository<NominalInstrument>;

  instruments: RequestHandler = async (req, res) => {
    const instruments = await this.instrumentRepo.find({
      select: { derivedProducts: { id: true } },
      relations: { derivedProducts: true },
      order: { type: "ASC", id: "ASC" },
    });
    res.send(
      instruments.map((instrument) => ({
        ...instrument,
        derivedProducts: undefined,
        derivedProductIds: instrument.derivedProducts.map((product) => product.id),
      })),
    );
  };

  instrument: RequestHandler = async (req, res, next) => {
    const instrument = await this.instrumentRepo.findOne({
      where: { id: req.params.instrumentId },
      relations: { derivedProducts: true },
    });
    if (!instrument) {
      return next({ status: 404, errors: ["No instrument match this id"] });
    }
    res.send(instrument);
  };

  listInstrumentPids: RequestHandler = async (req, res) => {
    if ("includeSite" in req.query) {
      const latestSite = this.instrumentUploadRepo
        .createQueryBuilder("upload")
        .distinctOn(["upload.instrumentInfoUuid"])
        .select("upload.instrumentInfoUuid")
        .addSelect("upload.siteId")
        .addSelect("MAX(upload.measurementDate)", "latestDate")
        .addSelect(
          `CASE
              WHEN MAX(upload.measurementDate) > CURRENT_DATE - 3 THEN 'active'
              WHEN MAX(upload.measurementDate) > CURRENT_DATE - 7 THEN 'recent'
              ELSE 'inactive'
            END`,
          "status",
        )
        .where("upload.measurementDate > CURRENT_DATE - 182")
        .groupBy("upload.instrumentInfoUuid")
        .addGroupBy("upload.siteId")
        .orderBy("upload.instrumentInfoUuid")
        .addOrderBy('"latestDate"', "DESC")
        .getQuery();
      const rawData = await this.instrumentInfoRepo
        .createQueryBuilder("instrument_info")
        .select("instrument_info.*")
        .addSelect('latest_site."siteId"')
        .addSelect("COALESCE(latest_site.status, 'inactive')", "status")
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
  };

  instrumentPid: RequestHandler = async (req, res, next) => {
    const pid = await this.instrumentInfoRepo.findOne({
      where: { uuid: req.params.uuid },
      relations: { instrument: true },
    });
    if (!pid) {
      return next({ status: 404, errors: ["No instrument PID match this id"] });
    }
    const locations = await this.dataSource.query(
      `WITH gaps AS (
        SELECT
          "siteId",
          "measurementDate",
          COALESCE(CAST("siteId" != LAG("siteId") OVER (ORDER BY "measurementDate" DESC) AS INT), 1) AS "isNewPeriod"
        FROM regular_file
        WHERE "instrumentPid" = $1
      ), periods AS (
        SELECT
          "siteId",
          "measurementDate",
          SUM("isNewPeriod") OVER (ORDER BY "measurementDate" DESC) AS "periodId"
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
      ORDER BY "startDate" DESC`,
      [pid.pid],
    );
    res.send({ ...pid, locations });
  };

  nominalInstrument: RequestHandler = async (req, res, next) => {
    const query = req.query as unknown as { date: string; site: string; product: string };
    if (!isValidDate(query.date)) {
      return next({ status: 400, errors: "date is invalid" });
    }
    if (!query.site) {
      return next({ status: 400, errors: "site is required" });
    }
    if (!query.product) {
      return next({ status: 400, errors: "product is required" });
    }
    const data = await this.nominalInstrumentRepo.findOne({
      where: {
        site: { id: query.site },
        product: { id: query.product },
        measurementDate: LessThanOrEqual(query.date),
      },
      relations: { instrumentInfo: true },
      order: { measurementDate: "DESC" },
    });
    if (!data) {
      return next({ status: 404, errors: "Nominal instrument not specified" });
    }
    res.send({
      siteId: data.siteId,
      productId: data.productId,
      measurementDate: data.measurementDate,
      nominalInstrument: data.instrumentInfo,
    });
  };
}
