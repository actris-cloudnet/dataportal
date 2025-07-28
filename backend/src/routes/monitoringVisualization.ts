import { RequestHandler } from "express";
import { Brackets, DataSource, Repository } from "typeorm";
import { MonitoringVisualization } from "../entity/MonitoringVisualization";

export class MonitoringVisualizationRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.monitoringVisualizationRepo = dataSource.getRepository(MonitoringVisualization);
  }
  readonly dataSource: DataSource;
  readonly monitoringVisualizationRepo: Repository<MonitoringVisualization>;

  putMonitoringVisualization: RequestHandler = async (_req, res, next) => {
    const vis = res.locals.visualisationData;
    try {
      await this.monitoringVisualizationRepo.save({
        ...vis,
        sourceFile: { uuid: vis.sourceFileUuid },
        monitoringProductVariable: { id: vis.monitoringProductVariableId },
      });
      res.sendStatus(201);
    } catch (err) {
      console.error(err);
      next({ status: 500, errors: ["Failed to save visualization to database."] });
    }
  };
  monitoringVisualization: RequestHandler = async (_req, res, next) => {
    const LIMIT = 10000;
    const query = res.locals;
    try {
      const qb = this.monitoringVisualizationRepo
        .createQueryBuilder("viz")
        .leftJoinAndSelect("viz.sourceFile", "file")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.monitoringProduct", "product")
        .leftJoinAndSelect("file.instrumentInfo", "instrumentInfo")
        .leftJoinAndSelect("viz.monitoringProductVariable", "var")
        .leftJoinAndSelect("var.monitoringProduct", "varProduct");

      if (query.productId) qb.andWhere("varProduct.id IN (:...productIds)", { productIds: query.productId });

      const variablePairs = parseVariablePairs(query.variableId);

      if (variablePairs.length > 0) {
        qb.andWhere(
          new Brackets((qbExp) => {
            variablePairs.forEach(({ productId, variableId }, idx) => {
              qbExp.orWhere(`(varProduct.id = :productId${idx} AND var.id = :variableId${idx})`, {
                [`productId${idx}`]: productId,
                [`variableId${idx}`]: variableId,
              });
            });
          }),
        );
      }

      if (query.siteId) qb.andWhere("site.id IN (:...siteIds)", { siteIds: query.siteId });
      if (query.instrumentUuid)
        qb.andWhere("instrumentInfo.uuid IN (:...instrumentUuids)", { instrumentUuids: query.instrumentUuid });
      if (query.period) qb.andWhere("file.periodType IN (:...periods)", { periods: query.period });
      if (query.startDate) qb.andWhere("file.startDate IN (:...startDates)", { startDates: query.startDate });

      qb.orderBy("file.startDate", "DESC")
        .addOrderBy("site.id", "ASC")
        .addOrderBy("product.id", "ASC")
        .addOrderBy("var.order", "ASC")
        .take(LIMIT);

      const visualizations = await qb.getMany();

      if (visualizations.length === LIMIT) {
        return next({
          status: 400,
          errors: [`Too many visualizations returned – refine your query. The upper bound is ${LIMIT}.`],
        });
      }

      res.json(visualizations);
    } catch (error) {
      next(error);
    }
  };
}

function parseVariablePairs(vars: string[] | null) {
  if (!vars) {
    return [];
  }
  const variablePairs: { productId: string; variableId: string }[] = [];

  for (const entry of vars) {
    if (typeof entry !== "string") continue;
    const [productId, variableId] = entry.split("::");
    if (productId && variableId) {
      variablePairs.push({ productId, variableId });
    }
  }
  return variablePairs;
}
