import {
  CreateDateColumn, 
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
} from "typeorm";
import { Site } from "./Site";
import { MonitoringProduct } from "./MonitoringProduct";
import { MonitoringVisualization } from "./MonitoringVisualization";
import { InstrumentInfo } from "./Instrument";

export enum PeriodType {
  ALL = "all",
  YEAR = "year",
  MONTH = "month",
  DAY = "day",
}

@Entity()
export class MonitoringFile {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({ type: "date" })
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

