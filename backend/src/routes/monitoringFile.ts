import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";
import { MonitoringFile } from "../entity/MonitoringFile";

export class MonitoringFileRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.monitoringFileRepo = dataSource.getRepository(MonitoringFile);
  }

  readonly dataSource: DataSource;
  readonly monitoringFileRepo: Repository<MonitoringFile>;

  putMonitoringFile: RequestHandler = async (req, res) => {
    const file = req.body;
    await this.monitoringFileRepo.save(file);
    res.sendStatus(201);
  };
}

