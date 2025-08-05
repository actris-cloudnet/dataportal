import { RequestHandler } from "express";
import { DataSource, In, Repository } from "typeorm";
import { MonitoringVisualization } from "../entity/MonitoringVisualization";

export class MonitoringVisualizationRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.monitoringVisualizationRepo = dataSource.getRepository(MonitoringVisualization);
  }
  readonly dataSource: DataSource;
  readonly monitoringVisualizationRepo: Repository<MonitoringVisualization>;

  putMonitoringVisualization: RequestHandler = async (req, res, next) => {
    const vis = req.body;
    await this.monitoringVisualizationRepo.save(vis);
    res.sendStatus(201);
  };
  monitoringVisualization: RequestHandler = async (req, res, next) => {
    console.log(req.query);
    try {
      let productIds: string[] | undefined;
      if (typeof req.query.productId === "string") {
        productIds = req.query.productId.split(",").map((s) => s.trim());
      }
      const qb = this.monitoringVisualizationRepo
        .createQueryBuilder("viz")
        .leftJoinAndSelect("viz.sourceFile", "file")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.monitoringProduct", "product")
        .leftJoinAndSelect("file.instrumentInfo", "instrumentInfo")
        .leftJoinAndSelect("viz.monitoringProductVariable", "var")
        .leftJoinAndSelect("var.monitoringProduct", "varProduct");

      if (productIds) {
        qb.andWhere("varProduct.id IN (:...productIds)", { productIds });
      }

      qb.orderBy("file.startDate", "DESC")
        .addOrderBy("site.id", "ASC")
        .addOrderBy("product.id", "ASC")
        .addOrderBy("var.order", "ASC");

      const visualizations = await qb.getMany();
      res.json(visualizations);
    } catch (error) {
      next(error);
    }
  };
}
