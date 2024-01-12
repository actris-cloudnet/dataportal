import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Site } from "./Site";
import { Product } from "./Product";
import { Instrument } from "./Instrument";
import { Model } from "./Model";

export enum Status {
  /** Task is scheduled to run at `scheduledAt`. */
  CREATED = "created",
  /** Task is running. */
  RUNNING = "running",
  /** Task is currently running but should be restarted. */
  RESTART = "restart",
  /** Failed to process task. */
  FAILED = "failed",
}

export abstract class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne((_) => Site)
  site!: Site;

  @Column({ type: "date" })
  measurementDate!: Date;

  @Column({ type: "enum", enum: Status })
  status!: Status;

  @Column()
  scheduledAt!: Date;
}

@Entity()
@Unique(["instrument", "instrumentPid", "site", "measurementDate"])
export class UploadTask extends Task {
  @ManyToOne((_) => Instrument)
  instrument!: Instrument;

  @Column()
  instrumentPid!: string;
}

@Entity()
@Unique(["product", "site", "measurementDate"])
export class ProductTask extends Task {
  @ManyToOne((_) => Product)
  product!: Product;
}

@Entity()
@Unique(["model", "site", "measurementDate"])
export class ModelTask extends Task {
  @ManyToOne((_) => Model)
  model!: Model;
}
