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

  putMonitoringFile: RequestHandler = async (_req, res) => {
    const { startDate, periodType, siteId, monitoringProductId, instrumentUuid } = res.locals.fileData;

    const [site, product, instrument] = await Promise.all([
      this.dataSource.getRepository(Site).findOneByOrFail({ id: siteId }),
      this.dataSource.getRepository(MonitoringProduct).findOneByOrFail({ id: monitoringProductId }),
      this.dataSource.getRepository(InstrumentInfo).findOneByOrFail({ uuid: instrumentUuid }),
    ]);

    let newFile: MonitoringFile | null = null;
    try {
      await this.dataSource.transaction(async (manager) => {
        const existing = await manager.findOne(MonitoringFile, {
          where: {
            startDate: periodType === PeriodType.ALL ? IsNull() : startDate,
            periodType,
            site: {
              id: siteId,
            },
            monitoringProduct: {
              id: monitoringProductId,
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
          ...res.locals.fileData,
          site,
          monitoringProduct: product,
          instrumentInfo: instrument,
        });

        await manager.save(newFile);
      });
    } catch (error) {
      console.error("Failed to save MonitoringFile:", error);
      return res.status(500).json({ error: "Failed to create or replace MonitoringFile" });
    }

    res.status(201).json(newFile);
  };

  getDistinctStartDatesByPeriodType: RequestHandler = async (_req, res) => {
    const result = await this.monitoringFileRepo
      .createQueryBuilder("monitoring_file")
      .select("monitoring_file.periodType", "periodType")
      .addSelect("monitoring_file.startDate", "startDate")
      .distinct(true)
      .orderBy("monitoring_file.startDate", "DESC")
      .getRawMany();
    const grouped = groupByPeriodType(result);

    res.json(grouped);
  };

  getInstrumentsWithMonitoringFiles: RequestHandler = async (_req, res) => {
    try {
      const instruments = await this.dataSource
        .getRepository(InstrumentInfo)
        .createQueryBuilder("instrument")
        .innerJoin(MonitoringFile, "monitoring_file", "monitoring_file.instrumentInfoUuid = instrument.uuid")
        .distinct(true)
        .orderBy("instrument.name", "ASC")
        .getMany();

      res.json(instruments);
    } catch (err) {
      console.error("Error fetching instruments with monitoring files:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getSitesWithMonitoringFiles: RequestHandler = async (_req, res) => {
    try {
      const sites = await this.dataSource
        .getRepository(Site)
        .createQueryBuilder("site")
        .innerJoin(MonitoringFile, "monitoring_file", "monitoring_file.siteId = site.id")
        .distinct(true)
        .getMany();

      res.json(sites);
    } catch (err) {
      console.error("Error fetching sites with monitoring files:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
function groupByPeriodType(rows: { periodType: string; startDate: Date | null }[]): Record<string, (string | null)[]> {
  return rows.reduce(
    (acc, row) => {
      const { periodType, startDate } = row;
      if (!acc[periodType]) {
        acc[periodType] = [];
      }
      const formattedDate = startDate ? startDate.toISOString().slice(0, 10) : null;
      acc[periodType].push(formattedDate);
      return acc;
    },
    {} as Record<string, (string | null)[]>,
  );
}
