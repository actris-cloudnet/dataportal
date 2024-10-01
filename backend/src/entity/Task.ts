import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Site } from "./Site";
import { Product } from "./Product";
import { InstrumentInfo } from "./Instrument";
import { Model } from "./Model";

export enum TaskStatus {
  /** Task is scheduled to run at `scheduledAt`. */
  CREATED = "created",
  /** Task is running. */
  RUNNING = "running",
  /** Task is currently running but should be restarted. */
  RESTART = "restart",
  /** Failed to process task. */
  FAILED = "failed",
  /** Task processed successfully. */
  DONE = "done",
}

export enum TaskType {
  PROCESS = "process",
  FREEZE = "freeze",
  PLOT = "plot",
  QC = "qc",
  DVAS = "dvas",
  HKD = "hkd",
}

export function isTaskStatus(x: any): x is TaskStatus {
  return Object.values(TaskStatus).includes(x);
}

@Entity()
// Added "NULLS NOT DISTINCT" manually to the migration, see
// https://github.com/typeorm/typeorm/issues/9827
@Unique(["type", "site", "measurementDate", "product", "instrumentInfo", "model"])
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: TaskType })
  type!: TaskType;

  @ManyToOne((_) => Site)
  site!: Site;

  @Column()
  siteId!: Site["id"];

  @Column({ type: "date" })
  measurementDate!: Date;

  @Column({ type: "enum", enum: TaskStatus })
  status!: TaskStatus;

  @ManyToOne((_) => Product)
  product!: Product;

  @Column()
  productId!: Product["id"];

  @ManyToOne((_) => InstrumentInfo, { nullable: true })
  instrumentInfo!: InstrumentInfo | null;

  @Column({ nullable: true })
  instrumentInfoUuid!: InstrumentInfo["uuid"] | null;

  @ManyToOne((_) => Model, { nullable: true })
  model!: Model | null;

  @Column({ nullable: true })
  modelId!: Model["id"];

  /** Task will not run before this datetime. */
  @Column()
  scheduledAt!: Date;

  @Column("timestamp", { nullable: true })
  doneAt!: Date | null;

  /** Priority from 0 (highest) to 100 (lowest). */
  @Column("smallint")
  priority!: number;

  @Column("text", { nullable: true })
  batchId!: string | null;
}
