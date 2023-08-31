import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { Instrument } from "../entity/Instrument";

export class InstrumentRoutes {
  constructor(dataSource: DataSource) {
    this.instrumentRepo = dataSource.getRepository(Instrument);
  }

  readonly instrumentRepo: Repository<Instrument>;

  instruments: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const instruments = await this.instrumentRepo.find({ order: { type: "ASC", id: "ASC" } });
      res.send(instruments);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
