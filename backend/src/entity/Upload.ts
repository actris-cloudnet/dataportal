import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryColumn, Unique } from "typeorm";
import { Site } from "./Site";
import { Instrument } from "./Instrument";
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

@Entity()
export abstract class Upload {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({ type: "varchar", length: 32, unique: true })
  checksum!: string;

  @Column()
  filename!: string;

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

  @ManyToOne((_) => Site, (site) => site.uploads, { nullable: false })
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

  @Column({ type: "text", nullable: true })
  instrumentPid!: string | null;

  @Column({ type: "text", array: true, default: [], nullable: false })
  tags!: Array<string>;

  constructor(args: UploadOptions, instrument: Instrument, instrumentPid: string, tags: Array<string>) {
    super(args);
    this.instrument = instrument;
    this.instrumentPid = instrumentPid;
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
