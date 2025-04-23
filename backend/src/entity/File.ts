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
import { basename } from "path";
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
  s3key!: string;

  @Column()
  version!: string;

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

  get filename() {
    return basename(this.s3key);
  }

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
}

@Entity()
export class ModelFile extends File {
  @ManyToOne((_) => Model, (model) => model.files, { nullable: false })
  model!: Model;

  @OneToMany((_) => ModelVisualization, (viz) => viz.sourceFile)
  visualizations!: ModelVisualization[];
}

export function isFile(obj: any) {
  return (
    "uuid" in obj &&
    "measurementDate" in obj &&
    isValidDate(obj.measurementDate) &&
    "site" in obj &&
    "product" in obj &&
    "checksum" in obj &&
    "size" in obj &&
    "format" in obj &&
    "s3key" in obj &&
    "version" in obj &&
    (obj.volatile === true || (obj.volatile === false && "pid" in obj))
  );
}
