import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { InstrumentUpload } from "./Upload";
import { Calibration } from "./Calibration";

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

  @Column({ type: "text", array: true, default: [], nullable: false })
  allowedTags!: Array<string>;

  @OneToMany((_) => InstrumentUpload, (upload) => upload.instrument)
  uploads!: InstrumentUpload[];
}
