import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { MonitoringProduct } from "../entity/MonitoringProduct";

export class MonitoringProductRoutes {
  private monitoringProductRepo: Repository<MonitoringProduct>;

  constructor(dataSource: DataSource) {
    this.monitoringProductRepo = dataSource.getRepository(MonitoringProduct);
  }

  allMonitoringProducts: RequestHandler = async (_req, res, next) => {
    try {
      const products = await this.monitoringProductRepo.find();
      res.json(
        products.map((product) => ({
          id: product.id,
          humanReadableName: product.humanReadableName,
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  allMonitoringProductsWithVariables: RequestHandler = async (_req, res, next) => {
    try {
      const productsWithVars = await this.monitoringProductRepo.find({
        relations: ["monitoringVariables"],
        order: {
          id: "ASC",
          monitoringVariables: {
            order: "ASC",
          },
        },
      });

      const result = productsWithVars.map((product) => ({
        id: product.id,
        humanReadableName: product.humanReadableName,
        variables: product.monitoringVariables.map((v) => ({
          id: v.id,
          humanReadableName: v.humanReadableName,
          order: v.order,
        })),
      }));

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
