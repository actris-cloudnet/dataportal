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
    try {
      const visualizations = await this.monitoringVisualizationRepo.find({
        relations: {
          sourceFile: {
            site: true,
            monitoringProduct: {
              monitoringVariables: true,
            },
            instrumentInfo: true,
          },
          monitoringProductVariable: {
            monitoringProduct: true,
          },
        },
        order: {
          monitoringProductVariable: {
            order: "ASC",
          },
        },
      });
      res.json(visualizations);
    } catch (error) {
      next(error);
    }
  };
}
