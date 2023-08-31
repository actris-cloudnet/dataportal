import { DataSource, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";
import { Model } from "../entity/Model";

export class ModelRoutes {
  constructor(dataSource: DataSource) {
    this.modelRepository = dataSource.getRepository(Model);
  }

  private modelRepository: Repository<Model>;

  models: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const models = await this.modelRepository.find({
        order: { optimumOrder: "ASC", id: "ASC" },
        relations: {
          citations: req.query.showCitations !== undefined,
        },
      });
      res.send(models);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
