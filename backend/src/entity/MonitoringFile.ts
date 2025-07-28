import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  Check,
  Unique,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Site } from "./Site";
import { MonitoringProduct } from "./MonitoringProduct";
import { MonitoringVisualization } from "./MonitoringVisualization";
import { InstrumentInfo } from "./Instrument";

export enum PeriodType {
  ALL = "all",
  YEAR = "year",
  MONTH = "month",
  WEEK = "week",
  DAY = "day",
}

@Entity()
@Check(`("periodType" = 'all' AND "startDate" IS NULL) OR ("periodType" != 'all' AND "startDate" IS NOT NULL)`)
@Unique(["startDate", "periodType", "site", "monitoringProduct", "instrumentInfo"])
export class MonitoringFile {
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column({ type: "date", nullable: true })
  startDate!: Date;

  @Column({ type: "enum", enum: PeriodType })
  periodType!: PeriodType;

  @ManyToOne((_) => Site, { nullable: false })
  site!: Site;

  @ManyToOne((_) => MonitoringProduct, { nullable: false })
  monitoringProduct!: MonitoringProduct;

  @ManyToOne(() => InstrumentInfo, { nullable: false })
  instrumentInfo!: InstrumentInfo;

  @OneToMany(() => MonitoringVisualization, (viz) => viz.sourceFile)
  monitoringVisualizations!: MonitoringVisualization[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
