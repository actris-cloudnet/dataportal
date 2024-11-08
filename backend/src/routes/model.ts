import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";
import { Model } from "../entity/Model";

export class ModelRoutes {
  constructor(dataSource: DataSource) {
    this.modelRepository = dataSource.getRepository(Model);
  }

  private modelRepository: Repository<Model>;

  models: RequestHandler = async (req, res) => {
    const models = await this.modelRepository.find({
      order: { optimumOrder: "ASC", id: "ASC" },
      relations: {
        citations: req.query.showCitations !== undefined,
      },
    });
    res.send(models);
  };
}
