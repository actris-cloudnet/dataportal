import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Site } from "./Site";
import { Instrument } from "./Instrument";

export interface CalibrationData {
  calibrationFactor: number;
  createdAt: Date;
}

@Entity()
@Unique(["measurementDate", "site", "instrument"])
export class Calibration {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne((_) => Instrument, (instrument) => instrument.calibrations)
  instrument!: Instrument;

  @ManyToOne((_) => Site, (site) => site.calibrations)
  site!: Site;

  @Column({ type: "date" })
  measurementDate!: Date;

  @Column({
    type: "jsonb",
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  calibration!: Array<CalibrationData>;
}
