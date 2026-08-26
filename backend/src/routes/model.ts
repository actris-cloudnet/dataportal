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

  model: RequestHandler = async (req, res, next) => {
    const model = await this.modelRepository.findOneBy({ id: req.params.modelId as string });
    if (!model) return next({ status: 404, errors: ["No model match this id"] });
    res.send(model);
  };
}
