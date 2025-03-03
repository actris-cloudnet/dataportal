import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { InstrumentUpload } from "./Upload";
import { RegularFile } from "./File";
import { Product } from "./Product";
import { Site } from "./Site";

export enum InstrumentType {
  RADAR = "radar",
  LIDAR = "lidar",
  MWR = "mwr",
  DISDROMETER = "disdrometer",
}

@Entity()
export class Instrument {
  @PrimaryColumn()
  id!: string;

  @Column()
  type!: InstrumentType;

  @Column()
  humanReadableName!: string;

  @Column({ default: "" })
  shortName!: string;

  @Column({ type: "text", array: true, default: [], nullable: false })
  allowedTags!: string[];

  @OneToMany((_) => InstrumentUpload, (upload) => upload.instrument)
  uploads!: InstrumentUpload[];

  @OneToMany((_) => RegularFile, (regularFile) => regularFile.instrument)
  files!: RegularFile[];

  @ManyToMany((_) => Product, (product) => product.sourceInstruments)
  @JoinTable()
  derivedProducts!: Product[];
}

@Entity()
export class InstrumentInfo {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({ unique: true })
  pid!: string;

  @ManyToOne((_) => Instrument)
  instrument!: Instrument;

  @Column()
  name!: string;

  @Column({ type: "text", array: true })
  owners!: string[];

  @Column()
  model!: string;

  @Column()
  type!: string;

  @Column({ type: "text", nullable: true })
  serialNumber!: string | null;
}

@Entity()
export class NominalInstrument {
  @PrimaryColumn()
  siteId!: string;

  @PrimaryColumn()
  productId!: string;

  @ManyToOne((_) => Site)
  site!: Site;

  @ManyToOne((_) => Product)
  product!: Product;

  @Column({ type: "date", primary: true })
  measurementDate!: string;

  @ManyToOne((_) => InstrumentInfo)
  instrumentInfo!: InstrumentInfo;
}
