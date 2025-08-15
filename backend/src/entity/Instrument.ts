import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { Product } from "./Product";
import { Site } from "./Site";

export enum InstrumentType {
  RADAR = "radar",
  LIDAR = "lidar",
  MWR = "mwr",
  DISDROMETER = "disdrometer",
  RAIN_RADAR = "rain-radar",
  RAIN_GAUGE = "rain-gauge",
  WEATHER_STATION = "weather-station",
  DOPPLER_LIDAR = "doppler-lidar",
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

  @ManyToOne((_) => Instrument, { nullable: false })
  instrument!: Instrument;

  @Column()
  instrumentId!: Instrument["id"];

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
