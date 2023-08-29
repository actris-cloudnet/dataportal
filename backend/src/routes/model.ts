import { DataSource } from "typeorm";
import { Request, RequestHandler, Response } from "express";
import { Model } from "../entity/Model";

export class ModelRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  private dataSource: DataSource;

  models: RequestHandler = async (req: Request, res: Response, next) => {
    // TODO: why query builder is used?
    const qb = this.dataSource.getRepository(Model).createQueryBuilder("model");
    if (req.query.showCitations) qb.leftJoinAndSelect("model.citations", "citations");
    else qb.select();

    qb.addOrderBy("model.optimumOrder", "ASC")
      .addOrderBy("model.id", "ASC")
      .getMany()
      .then((result) => res.send(result))
      .catch((err) => next({ status: 500, errors: err }));
  };
}
