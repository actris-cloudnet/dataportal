import { Column, Entity, BeforeInsert, BeforeUpdate, ManyToOne, PrimaryColumn } from "typeorm";
import { InstrumentInfo } from "./Instrument";

@Entity()
export class Calibration {
  @ManyToOne(() => InstrumentInfo)
  instrumentInfo!: InstrumentInfo;

  @PrimaryColumn()
  instrumentInfoUuid!: string;

  @Column({ type: "date", primary: true })
  measurementDate!: string;

  @Column({ primary: true })
  key!: string;

  @Column({ type: "jsonb" })
  data!: any;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

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
