import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm";
import { Site } from "./Site";
import { Instrument, InstrumentInfo } from "./Instrument";
import { Model } from "./Model";
import { v4 as generateUuidV4 } from "uuid";

export enum Status {
  CREATED = "created",
  UPLOADED = "uploaded",
  PROCESSED = "processed",
  INVALID = "invalid",
}

export type UploadOptions = {
  checksum: string;
  filename: string;
  measurementDate: string;
  site: Site;
  status: Status;
};

export abstract class Upload {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({ type: "varchar", length: 32, unique: true })
  checksum!: string;

  @Column()
  filename!: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  s3key!: string | null;

  @Column({ type: "date" })
  measurementDate!: Date;

  @Column({ default: 0, type: "bigint" })
  size!: number;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.CREATED,
  })
  status!: Status;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

  @ManyToOne((_) => Site, { nullable: false })
  site!: Site;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }

  protected constructor(args: UploadOptions) {
    if (!args) return;
    this.uuid = generateUuidV4();
    this.checksum = args.checksum;
    this.filename = args.filename;
    this.measurementDate = new Date(args.measurementDate);
    this.site = args.site;
    this.status = args.status;
  }
}

@Entity()
@Unique(["site", "measurementDate", "filename", "instrument", "instrumentPid", "tags"])
export class InstrumentUpload extends Upload {
  @ManyToOne((_) => Instrument, (instrument) => instrument.uploads, { nullable: false })
  instrument!: Instrument;

  @Column({ type: "text" })
  instrumentPid!: string;

  @ManyToOne(() => InstrumentInfo, { nullable: true })
  instrumentInfo!: InstrumentInfo | null;

  @Column({ type: "text", array: true, default: [], nullable: false })
  tags!: string[];

  constructor(args: UploadOptions, instrumentInfo: InstrumentInfo, tags: Array<string>) {
    super(args);
    if (instrumentInfo) {
      this.instrument = instrumentInfo.instrument;
      this.instrumentPid = instrumentInfo.pid;
    }
    this.instrumentInfo = instrumentInfo;
    this.tags = tags;
  }
}

@Entity()
@Unique(["site", "measurementDate", "filename", "model"])
export class ModelUpload extends Upload {
  @ManyToOne((_) => Model, (model) => model.uploads, { nullable: false })
  model!: Model;

  constructor(args: UploadOptions, model: Model) {
    super(args);
    this.model = model;
  }
}
