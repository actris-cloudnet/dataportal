import { DataSource, Repository, IsNull } from "typeorm";
import { RequestHandler } from "express";
import { MonitoringFile, PeriodType } from "../entity/MonitoringFile";
import { MonitoringProduct } from "../entity/MonitoringProduct";
import { Site } from "../entity/Site";
import { InstrumentInfo } from "../entity/Instrument";
import { MonitoringVisualization } from "../entity/MonitoringVisualization";

export class MonitoringFileRoutes {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.monitoringFileRepo = dataSource.getRepository(MonitoringFile);
  }

  readonly dataSource: DataSource;
  readonly monitoringFileRepo: Repository<MonitoringFile>;

  putMonitoringFile: RequestHandler = async (req, res) => {
    const fileData = req.body;

    const {
      startDate,
      periodType,
      site: siteId,
      monitoringProduct: productId,
      instrumentInfo: instrumentUuid,
    } = fileData;

    const site = await this.dataSource.getRepository(Site).findOneByOrFail({ id: siteId });
    const product = await this.dataSource.getRepository(MonitoringProduct).findOneByOrFail({ id: productId });
    const instrument = await this.dataSource.getRepository(InstrumentInfo).findOneByOrFail({ uuid: instrumentUuid });

    let newFile: MonitoringFile | null = null;
    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(MonitoringFile, {
        where: {
          startDate: periodType === PeriodType.ALL ? IsNull() : startDate,
          periodType,
          site: {
            id: siteId,
          },
          monitoringProduct: {
            id: productId,
          },
          instrumentInfo: {
            uuid: instrumentUuid,
          },
        },
        relations: ["monitoringVisualizations"],
      });

      if (existing) {
        if (existing.monitoringVisualizations.length > 0) {
          await manager.getRepository(MonitoringVisualization).remove(existing.monitoringVisualizations);
        }
        await manager.remove(existing);
      }

      newFile = manager.create(MonitoringFile, {
        ...fileData,
        site,
        monitoringProduct: product,
        instrumentInfo: instrument,
      });

      await manager.save(newFile);
    });

    if (!newFile) {
      return res.status(500).json({ error: "Failed to create new MonitoringFile" });
    }
    res.status(201).json(newFile);
  };
}
