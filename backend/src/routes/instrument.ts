import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { Instrument, InstrumentInfo, NominalInstrument } from "../entity/Instrument";
import { InstrumentContact } from "../entity/InstrumentContact";
import { Person } from "../entity/Person";
import { InstrumentUpload } from "../entity/Upload";
import { isValidDate, validateDateRange, toContactResponse, resolveOrCreatePerson, userHasPermission } from "../lib";
import { PermissionType } from "../entity/Permission";

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.instrumentRepo = dataSource.getRepository(Instrument);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
    this.nominalInstrumentRepo = dataSource.getRepository(NominalInstrument);
    this.contactRepo = dataSource.getRepository(InstrumentContact);
    this.personRepo = dataSource.getRepository(Person);
  }

  readonly dataSource: DataSource;
  readonly instrumentRepo: Repository<Instrument>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly instrumentUploadRepo: Repository<InstrumentUpload>;
  readonly nominalInstrumentRepo: Repository<NominalInstrument>;
  readonly contactRepo: Repository<InstrumentContact>;
  readonly personRepo: Repository<Person>;

  instruments: RequestHandler = async (req, res) => {
    const instruments = await this.instrumentRepo.find({ order: { type: "ASC", id: "ASC" } });
    res.send(instruments);
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
    const instrument = await this.instrumentInfoRepo.findOne({
      where: { uuid: req.params.uuid },
      relations: { instrument: true },
    });
    if (!instrument) {
      return next({ status: 404, errors: ["No instrument PID match this id"] });
    }
    const locations = await this.dataSource.query(
      `WITH gaps AS (
        SELECT
          "siteId",
          "measurementDate",
          COALESCE(CAST("siteId" != LAG("siteId") OVER (ORDER BY "measurementDate" DESC) AS INT), 1) AS "isNewPeriod"
        FROM regular_file
        WHERE regular_file."instrumentInfoUuid" = $1 AND "tombstoneReason" IS NULL
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
      [instrument.uuid],
    );
    res.send({ ...instrument, locations });
  };

  nominalInstrument: RequestHandler = async (req, res, next) => {
    const query = req.query as unknown as { date: string; site: string; product: string };
    if (!isValidDate(query.date)) {
      return next({ status: 400, errors: "date is invalid" });
    }
    if (!query.site) {
      return next({ status: 400, errors: "site is required" });
    }

    const qb = this.nominalInstrumentRepo
      .createQueryBuilder("nominal")
      .distinctOn(["nominal.product"])
      .leftJoinAndSelect("nominal.instrumentInfo", "instrumentInfo")
      .where("nominal.site = :site", { site: query.site })
      .andWhere("nominal.measurementDate <= :date", { date: query.date })
      .orderBy("nominal.product")
      .addOrderBy("nominal.measurementDate", "DESC");

    if (query.product) {
      qb.andWhere("nominal.product = :product", { product: query.product }).limit(1);
    }

    const rows = await qb.getMany();

    let output: any = rows.map((row) => ({
      siteId: row.siteId,
      productId: row.productId,
      measurementDate: row.measurementDate,
      nominalInstrument: row.instrumentInfo,
    }));

    if (query.product) {
      if (rows.length !== 1) {
        return next({ status: 404, errors: "Nominal instrument not specified" });
      }
      output = output[0];
    }

    res.send(output);
  };

  listContacts: RequestHandler = async (req, res, next) => {
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: req.params.uuid });
    if (!instrumentInfo) {
      return next({ status: 404, errors: ["No instrument PID match this id"] });
    }
    const includeEmail =
      !!req.user && (await userHasPermission(this.dataSource, req.user.id!, PermissionType.canManageContacts));
    const contactQb = this.contactRepo
      .createQueryBuilder("c")
      .innerJoinAndSelect("c.person", "p")
      .where("c.instrumentInfoUuid = :uuid", { uuid: instrumentInfo.uuid })
      .orderBy("c.startDate", "DESC", "NULLS FIRST");
    if (includeEmail) contactQb.addSelect("p.email");
    const contacts = await contactQb.getMany();
    res.send(contacts.map((c) => toContactResponse(c, c.person, includeEmail)));
  };

  postContact: RequestHandler = async (req, res, next) => {
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: req.params.uuid });
    if (!instrumentInfo) {
      return next({ status: 404, errors: ["No instrument PID match this id"] });
    }
    const { firstName, lastName, orcid, email, startDate, endDate, personId } = req.body;
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) return next({ status: 400, errors: [dateError] });

    const personResult = await resolveOrCreatePerson(this.personRepo, { personId, firstName, lastName, orcid, email });
    if ("error" in personResult) return next({ status: personResult.status, errors: [personResult.error] });
    const person = personResult;

    const contact = this.contactRepo.create({
      instrumentInfoUuid: instrumentInfo.uuid,
      personId: person.id,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    const saved = await this.contactRepo.save(contact);
    res.status(201).json(toContactResponse(saved, person, true));
  };

  putContact: RequestHandler = async (req, res, next) => {
    const id = parseInt(req.params.contactId, 10);
    if (isNaN(id)) {
      return next({ status: 400, errors: ["Invalid contact id"] });
    }
    const contact = await this.contactRepo
      .createQueryBuilder("c")
      .innerJoinAndSelect("c.person", "p")
      .addSelect("p.email")
      .where("c.id = :id", { id })
      .getOne();
    if (!contact || contact.instrumentInfoUuid !== req.params.uuid) {
      return next({ status: 404, errors: ["Contact not found"] });
    }
    const { startDate, endDate, email } = req.body;
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) return next({ status: 400, errors: [dateError] });
    contact.startDate = startDate || null;
    contact.endDate = endDate || null;
    if (email !== undefined) {
      contact.person.email = email?.trim() || undefined;
      await this.personRepo.save(contact.person);
    }
    const saved = await this.contactRepo.save(contact);
    res.json(toContactResponse(saved, contact.person, true));
  };

  deleteContact: RequestHandler = async (req, res, next) => {
    const id = parseInt(req.params.contactId, 10);
    if (isNaN(id)) {
      return next({ status: 400, errors: ["Invalid contact id"] });
    }
    const result = await this.contactRepo.delete({ id, instrumentInfoUuid: req.params.uuid });
    if (!result.affected) {
      return next({ status: 404, errors: ["Contact not found"] });
    }
    res.sendStatus(204);
  };
}
