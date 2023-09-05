import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Site } from "./Site";
import { Product } from "./Product";
import { ModelFile, RegularFile, File } from "./File";
import { ErrorLevel } from "./QualityReport";
import { Instrument } from "./Instrument";

@Entity()
export class SearchFile {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({ type: "date" })
  measurementDate!: Date;

  @ManyToOne((_) => Site, (site) => site.files, { nullable: false })
  site!: Site;

  @ManyToOne((_) => Product, (product) => product.files, { nullable: false })
  product!: Product;

  @Column()
  size!: number;

  @Column({ default: true })
  volatile!: boolean;

  @Column({ default: false })
  legacy!: boolean;

  @Column({
    type: "enum",
    enum: ErrorLevel,
    nullable: true,
  })
  errorLevel!: ErrorLevel | null;

  @ManyToOne((_) => Instrument, (instrument) => instrument.files, { nullable: true })
  instrument!: Instrument | null;

  @Column({ nullable: true })
  instrumentPid!: string;

  constructor(file: RegularFile | ModelFile) {
    // A typeorm hack, see https://github.com/typeorm/typeorm/issues/3903
    if (typeof file == "undefined") return;

    this.uuid = file.uuid;
    this.measurementDate = file.measurementDate;
    this.site = file.site;
    this.product = file.product;
    this.size = file.size;
    this.volatile = file.volatile;
    this.legacy = file.legacy || false;
    this.errorLevel = file.errorLevel;
    if ("instrument" in file) {
      this.instrument = file.instrument;
    }
    if ("instrumentPid" in file) {
      this.instrumentPid = file.instrumentPid;
    }
  }
}
