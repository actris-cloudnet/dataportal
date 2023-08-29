import { Request, RequestHandler, Response } from "express";
import { DataSource } from "typeorm";
import { Instrument } from "../entity/Instrument";

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  readonly dataSource: DataSource;

  instruments: RequestHandler = async (_req: Request, res: Response, next) => {
    // TODO: why query builder is used?
    this.dataSource
      .getRepository(Instrument)
      .createQueryBuilder("instrument")
      .select()
      .addOrderBy("instrument.type", "ASC")
      .addOrderBy("instrument.id", "ASC")
      .getMany()
      .then((result) => res.send(result))
      .catch((err) => next({ status: 500, errors: err }));
  };
}
