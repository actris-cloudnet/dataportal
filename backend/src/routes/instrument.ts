import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { Instrument, InstrumentInfo, NominalInstrument } from "../entity/Instrument";
import { InstrumentContact } from "../entity/InstrumentContact";
import { Person } from "../entity/Person";
import { InstrumentUpload } from "../entity/Upload";
import { Site } from "../entity/Site";
import { Product, ProductType } from "../entity/Product";
import {
  isValidDate,
  validateDateRange,
  toContactResponse,
  resolveOrCreatePerson,
  updateContactPerson,
  userHasPermission,
  findSourceInstrumentIds,
} from "../lib";
import { PermissionType } from "../entity/Permission";

const toNominalInstrumentResponse = (row: Omit<NominalInstrument, "site" | "product">) => ({
  siteId: row.siteId,
  productId: row.productId,
  measurementDate: row.measurementDate,
  nominalInstrument: row.instrumentInfo,
});

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.instrumentRepo = dataSource.getRepository(Instrument);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.instrumentUploadRepo = dataSource.getRepository(InstrumentUpload);
    this.nominalInstrumentRepo = dataSource.getRepository(NominalInstrument);
    this.contactRepo = dataSource.getRepository(InstrumentContact);
    this.personRepo = dataSource.getRepository(Person);
    this.siteRepo = dataSource.getRepository(Site);
    this.productRepo = dataSource.getRepository(Product);
  }

  readonly dataSource: DataSource;
  readonly instrumentRepo: Repository<Instrument>;
  readonly instrumentInfoRepo: Repository<InstrumentInfo>;
  readonly instrumentUploadRepo: Repository<InstrumentUpload>;
  readonly nominalInstrumentRepo: Repository<NominalInstrument>;
  readonly contactRepo: Repository<InstrumentContact>;
  readonly personRepo: Repository<Person>;
  readonly siteRepo: Repository<Site>;
  readonly productRepo: Repository<Product>;

  instruments: RequestHandler = async (req, res) => {
    const instruments = await this.instrumentRepo.find({ order: { type: "ASC", id: "ASC" } });
    res.send(instruments);
  };

  instrument: RequestHandler = async (req, res, next) => {
    const instrument = await this.instrumentRepo.findOne({
      where: { id: req.params.instrumentId as string },
      relations: { derivedProducts: true },
    });
    if (!instrument) {
      return next({ status: 404, errors: ["No instrument match this id"] });
    }
    res.send(instrument);
  };

  listInstrumentPids: RequestHandler = async (req, res, next) => {
    if ("includeSite" in req.query) {
      if ("site" in req.query || "product" in req.query) {
        return next({ status: 400, errors: "site and product filters cannot be combined with includeSite" });
      }
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
      const { site, product } = req.query as { site?: string; product?: string };
      const qb = this.instrumentInfoRepo
        .createQueryBuilder("instrument_info")
        .leftJoinAndSelect("instrument_info.instrument", "instrument")
        .orderBy("instrument_info.name", "ASC");
      if (site) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM instrument_upload u WHERE u."instrumentInfoUuid" = instrument_info.uuid AND u."siteId" = :site)`,
          { site },
        );
      }
      if (product) {
        const ids = await findSourceInstrumentIds(this.dataSource, product);
        if (ids.length === 0) return res.send([]);
        qb.andWhere("instrument.id IN (:...ids)", { ids });
      }
      res.send(await qb.getMany());
    }
  };

  instrumentPid: RequestHandler = async (req, res, next) => {
    const instrument = await this.instrumentInfoRepo.findOne({
      where: { uuid: req.params.uuid as string },
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

  listNominalInstruments: RequestHandler = async (req, res, next) => {
    const site = await this.siteRepo.findOneBy({ id: req.params.siteId as string });
    if (!site) return next({ status: 404, errors: "Site not found" });
    const rows = await this.nominalInstrumentRepo.find({
      where: { siteId: site.id },
      relations: { instrumentInfo: { instrument: true } },
      order: { productId: "ASC", measurementDate: "DESC" },
    });
    res.send(rows.map(toNominalInstrumentResponse));
  };

  postNominalInstrument: RequestHandler = async (req, res, next) => {
    try {
      const site = await this.siteRepo.findOneBy({ id: req.params.siteId as string });
      if (!site) return next({ status: 404, errors: "Site not found" });
      const { productId, instrumentInfoUuid, measurementDate } = req.body ?? {};
      const product = await this.validateNominalProduct(productId);
      const instrumentInfo = await this.validateNominalInstrument(product, instrumentInfoUuid);
      if (!isValidDate(measurementDate)) throw { status: 400, errors: "measurementDate must be YYYY-MM-DD" };
      await this.assertNominalSlotFree(site.id, product.id, measurementDate);
      await this.assertNominalChangesInstrument(site.id, product.id, measurementDate, instrumentInfo);
      await this.nominalInstrumentRepo.insert({
        siteId: site.id,
        productId: product.id,
        measurementDate,
        instrumentInfo,
      });
      res
        .status(201)
        .send(toNominalInstrumentResponse({ siteId: site.id, productId, measurementDate, instrumentInfo }));
    } catch (err) {
      next(err);
    }
  };

  putNominalInstrument: RequestHandler = async (req, res, next) => {
    try {
      const site = await this.siteRepo.findOneBy({ id: req.params.siteId as string });
      if (!site) return next({ status: 404, errors: "Site not found" });
      const existing = await this.findNominalInstrument(site.id, req.params);
      const body = req.body ?? {};
      const productId = existing.productId;
      const measurementDate = body.measurementDate ?? existing.measurementDate;
      let instrumentInfo = existing.instrumentInfo;
      if (body.instrumentInfoUuid && body.instrumentInfoUuid !== existing.instrumentInfo.uuid) {
        const product = await this.validateNominalProduct(productId);
        instrumentInfo = await this.validateNominalInstrument(product, body.instrumentInfoUuid);
      }
      if (!isValidDate(measurementDate)) throw { status: 400, errors: "measurementDate must be YYYY-MM-DD" };
      const dateChanged = measurementDate !== existing.measurementDate;
      if (dateChanged) {
        await this.assertNominalSlotFree(site.id, productId, measurementDate);
      }
      if (dateChanged || instrumentInfo.uuid !== existing.instrumentInfo.uuid) {
        await this.assertNominalChangesInstrument(
          site.id,
          productId,
          measurementDate,
          instrumentInfo,
          existing.measurementDate,
        );
      }
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(NominalInstrument);
        await repo.delete({ siteId: site.id, productId, measurementDate: existing.measurementDate });
        await repo.insert({ siteId: site.id, productId, measurementDate, instrumentInfo });
      });
      res.send(toNominalInstrumentResponse({ siteId: site.id, productId, measurementDate, instrumentInfo }));
    } catch (err) {
      next(err);
    }
  };

  deleteNominalInstrument: RequestHandler = async (req, res, next) => {
    try {
      const site = await this.siteRepo.findOneBy({ id: req.params.siteId as string });
      if (!site) return next({ status: 404, errors: "Site not found" });
      const existing = await this.findNominalInstrument(site.id, req.params);
      await this.nominalInstrumentRepo.delete({
        siteId: site.id,
        productId: existing.productId,
        measurementDate: existing.measurementDate,
      });
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  };

  private async findNominalInstrument(siteId: string, params: Record<string, any>): Promise<NominalInstrument> {
    const productId = params.productId as string;
    const measurementDate = params.measurementDate as string;
    if (!isValidDate(measurementDate)) throw { status: 400, errors: "measurementDate must be YYYY-MM-DD" };
    const existing = await this.nominalInstrumentRepo.findOne({
      where: { siteId, productId, measurementDate },
      relations: { instrumentInfo: { instrument: true } },
    });
    if (!existing) throw { status: 404, errors: "Nominal instrument not found" };
    return existing;
  }

  private async validateNominalProduct(productId: unknown): Promise<Product> {
    if (typeof productId !== "string" || !productId) throw { status: 400, errors: "productId is required" };
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw { status: 400, errors: "Product not found" };
    if (!product.type.includes(ProductType.INSTRUMENT)) {
      throw { status: 400, errors: `${product.humanReadableName} is not an instrument product` };
    }
    return product;
  }

  private async validateNominalInstrument(product: Product, instrumentInfoUuid: unknown): Promise<InstrumentInfo> {
    if (typeof instrumentInfoUuid !== "string" || !instrumentInfoUuid) {
      throw { status: 400, errors: "instrumentInfoUuid is required" };
    }
    const instrumentInfo = await this.instrumentInfoRepo.findOne({
      where: { uuid: instrumentInfoUuid },
      relations: { instrument: true },
    });
    if (!instrumentInfo) throw { status: 400, errors: "Instrument not found" };
    const compatibleIds = await findSourceInstrumentIds(this.dataSource, product.id);
    if (!compatibleIds.includes(instrumentInfo.instrument.id)) {
      throw {
        status: 400,
        errors: `${instrumentInfo.name} (${instrumentInfo.instrument.humanReadableName}) cannot produce ${product.humanReadableName}`,
      };
    }
    return instrumentInfo;
  }

  // Reject entries that repeat the neighbouring entry's instrument, as they would not change anything.
  private async assertNominalChangesInstrument(
    siteId: string,
    productId: string,
    measurementDate: string,
    instrumentInfo: InstrumentInfo,
    ignoreDate?: string,
  ) {
    const neighbour = (op: "<" | ">", order: "DESC" | "ASC") => {
      const qb = this.nominalInstrumentRepo
        .createQueryBuilder("nominal")
        .leftJoinAndSelect("nominal.instrumentInfo", "instrumentInfo")
        .where("nominal.siteId = :siteId AND nominal.productId = :productId", { siteId, productId })
        .andWhere(`nominal.measurementDate ${op} :date`, { date: measurementDate })
        .orderBy("nominal.measurementDate", order)
        .limit(1);
      if (ignoreDate) qb.andWhere("nominal.measurementDate != :ignoreDate", { ignoreDate });
      return qb.getOne();
    };
    const message = (date: string) =>
      `${instrumentInfo.name} is already the nominal ${productId} instrument from ${date}`;
    const prev = await neighbour("<", "DESC");
    if (prev && prev.instrumentInfo.uuid === instrumentInfo.uuid) {
      throw { status: 409, errors: message(prev.measurementDate) };
    }
    const next = await neighbour(">", "ASC");
    if (next && next.instrumentInfo.uuid === instrumentInfo.uuid) {
      throw { status: 409, errors: `${message(next.measurementDate)}; edit that entry's date instead` };
    }
  }

  private async assertNominalSlotFree(siteId: string, productId: string, measurementDate: string) {
    const existing = await this.nominalInstrumentRepo.findOneBy({ siteId, productId, measurementDate });
    if (existing) {
      throw { status: 409, errors: `A nominal instrument for ${productId} is already set from ${measurementDate}` };
    }
  }

  listContacts: RequestHandler = async (req, res, next) => {
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: req.params.uuid as string });
    if (!instrumentInfo) {
      return next({ status: 404, errors: ["No instrument PID match this id"] });
    }
    const includeEmail =
      !!req.user && (await userHasPermission(this.dataSource, req.user.id!, PermissionType.canManageContacts));
    const contactQb = this.contactRepo
      .createQueryBuilder("c")
      .innerJoinAndSelect("c.person", "p")
      .where("c.instrumentInfoUuid = :uuid", { uuid: instrumentInfo.uuid })
      .orderBy("c.startDate", "DESC", "NULLS FIRST")
      .addOrderBy("p.lastName", "ASC")
      .addOrderBy("p.firstName", "ASC");
    if (includeEmail) contactQb.addSelect("p.email");
    const contacts = await contactQb.getMany();
    res.send(contacts.map((c) => toContactResponse(c, c.person, includeEmail)));
  };

  postContact: RequestHandler = async (req, res, next) => {
    const instrumentInfo = await this.instrumentInfoRepo.findOneBy({ uuid: req.params.uuid as string });
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
    const id = parseInt(req.params.contactId as string, 10);
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
    const { startDate, endDate, email, orcid } = req.body;
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) return next({ status: 400, errors: [dateError] });
    const { error } = await updateContactPerson(contact.person, { email, orcid }, this.personRepo);
    if (error) return next({ status: 409, errors: [error] });
    contact.startDate = startDate || null;
    contact.endDate = endDate || null;
    const saved = await this.contactRepo.save(contact);
    res.json(toContactResponse(saved, contact.person, true));
  };

  deleteContact: RequestHandler = async (req, res, next) => {
    const id = parseInt(req.params.contactId as string, 10);
    if (isNaN(id)) {
      return next({ status: 400, errors: ["Invalid contact id"] });
    }
    const result = await this.contactRepo.delete({ id, instrumentInfoUuid: req.params.uuid as string });
    if (!result.affected) {
      return next({ status: 404, errors: ["Contact not found"] });
    }
    res.sendStatus(204);
  };
}
