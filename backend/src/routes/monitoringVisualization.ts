import { RequestHandler } from "express";
import { DataSource, In, Repository } from "typeorm";
import { MonitoringVisualization } from "../entity/MonitoringVisualization";

export class MonitoringVisualizationRoutes {
  constructor(dataSource: DataSource) {
    this.monitoringVisualizationRepo = dataSource.getRepository(MonitoringVisualization);
  }
  readonly monitoringVisualizationRepo: Repository<MonitoringVisualization>;
  
  putMonitoringVisualization: RequestHandler = async (req, res, next) => {
  };

}
