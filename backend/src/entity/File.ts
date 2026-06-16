import {
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
import { Product } from "./Product";
import { Visualization } from "./Visualization";
import { isValidDate } from "../lib";
import { Model } from "./Model";
import { ModelVisualization } from "./ModelVisualization";
import { ErrorLevel } from "./QualityReport";
import { Software } from "./Software";
import { InstrumentInfo } from "./Instrument";

@Unique(["checksum"])
@Index(["measurementDate", "site", "product"])
export abstract class File {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column()
  filename!: string;

  @Column({ type: "varchar", nullable: true })
  s3key!: string | null;

  @Column()
  version!: string;

  @Column({ default: false })
  newBucket!: boolean;

  @Column({ default: "" })
  pid!: string;

  @Column({ type: "varchar", nullable: true })
  dvasId!: string | null;

  @Column({ default: true })
  volatile!: boolean;

  @Column({ type: "varchar", nullable: true })
  tombstoneReason!: string | null;

  @Column({ default: false })
  legacy!: boolean;

  @Column({ type: "date" })
  measurementDate!: Date;

  @ManyToOne((_) => Site, { nullable: false })
  site!: Site;

  @Column()
  checksum!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column({ type: "real", nullable: true })
  coverage!: number;

  @Column()
  format!: string;

  @ManyToOne((_) => Product, { nullable: false })
  product!: Product;

  @Column({
    type: "enum",
    enum: ErrorLevel,
    nullable: true,
  })
  errorLevel!: ErrorLevel | null;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  dvasUpdatedAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  startTime!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  stopTime!: Date | null;

  @ManyToMany(() => Software)
  @JoinTable()
  software!: Software[];

  @BeforeInsert()
  updateDateCreation() {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  updateDateUpdate() {
    this.updatedAt = new Date();
  }
}

@Index(["instrumentInfo"])
@Index(["model"])
@Entity()
export class RegularFile extends File {
  @ManyToMany(() => RegularFile)
  @JoinTable()
  sourceRegularFiles!: RegularFile[];

  @ManyToMany(() => ModelFile)
  @JoinTable()
  sourceModelFiles!: ModelFile[];

  @OneToMany((_) => Visualization, (viz) => viz.sourceFile)
  visualizations!: Visualization[];

  @ManyToOne(() => InstrumentInfo, { nullable: true })
  instrumentInfo!: InstrumentInfo | null;

  // Set for evaluation products (e.g. L3) that are derived from a specific
  // model run; null for all other regular files.
  @ManyToOne((_) => Model, { nullable: true })
  model!: Model | null;
}

@Entity()
export class ModelFile extends File {
  @ManyToOne((_) => Model, { nullable: false })
  model!: Model;

  @OneToMany((_) => ModelVisualization, (viz) => viz.sourceFile)
  visualizations!: ModelVisualization[];
}

export function isFile(obj: any) {
  return (
    typeof obj.uuid === "string" &&
    isValidDate(obj.measurementDate) &&
    typeof obj.site === "string" &&
    typeof obj.product === "string" &&
    typeof obj.checksum === "string" &&
    (typeof obj.size === "number" || (typeof obj.size === "string" && obj.size.match(/^\d+$/))) &&
    typeof obj.format === "string" &&
    (obj.s3key === null || typeof obj.s3key === "string") &&
    typeof obj.filename === "string" &&
    typeof obj.version === "string" &&
    typeof obj.volatile === "boolean" &&
    (obj.volatile === true || (obj.volatile === false && typeof obj.pid === "string"))
  );
}
