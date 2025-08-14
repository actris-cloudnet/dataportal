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
      const qb = this.monitoringVisualizationRepo
        .createQueryBuilder("viz")
        .leftJoinAndSelect("viz.sourceFile", "file")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.monitoringProduct", "product")
        .leftJoinAndSelect("file.instrumentInfo", "instrumentInfo")
        .leftJoinAndSelect("viz.monitoringProductVariable", "var")
        .leftJoinAndSelect("var.monitoringProduct", "varProduct");

      let productIds: string[] | undefined;
      if (typeof req.query.productId === "string") {
        productIds = req.query.productId.split(",").map((s) => s.trim());
      }
      if (productIds) {
        qb.andWhere("varProduct.id IN (:...productIds)", { productIds });
      }

      let variablePairs: { productId: string; variableId: string }[] = [];

      if (typeof req.query.variableId === "string") {
        const entries = req.query.variableId.split(",").map((s) => s.trim());
        for (const entry of entries) {
          const parts = entry.split("::");
          if (parts.length === 2) {
            variablePairs.push({ productId: parts[0], variableId: parts[1] });
          }
        }

        if (variablePairs.length > 0) {
          qb.andWhere(
            "(" +
              variablePairs.map((_, idx) => `(varProduct.id = :prod${idx} AND var.id = :var${idx})`).join(" OR ") +
              ")",
            variablePairs.reduce(
              (params, pair, idx) => {
                params[`prod${idx}`] = pair.productId;
                params[`var${idx}`] = pair.variableId;
                return params;
              },
              {} as Record<string, string>,
            ),
          );
        }
      }

      let siteIds: string[] = [];
      if (typeof req.query.siteId === "string") {
        siteIds = req.query.siteId.split(",").map((s) => s.trim());
      }
      if (siteIds.length > 0) {
        qb.andWhere("site.id IN (:...siteIds)", { siteIds });
      }
      if (typeof req.query.period === "string" && req.query.period.length > 0 ) {
        qb.andWhere("file.periodType = :period", { period: req.query.period });
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
