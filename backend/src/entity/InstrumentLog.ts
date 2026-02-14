import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstrumentInfo } from "./Instrument";

export enum InstrumentLogEventType {
  CALIBRATION = "calibration",
  MAINTENANCE = "maintenance",
  MALFUNCTION = "malfunction",
}

@Entity()
export class InstrumentLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  instrumentInfoUuid!: string;

  @ManyToOne(() => InstrumentInfo, { onDelete: "CASCADE" })
  @JoinColumn({ name: "instrumentInfoUuid" })
  instrumentInfo!: InstrumentInfo;

  @Column({ type: "enum", enum: InstrumentLogEventType })
  eventType!: InstrumentLogEventType;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column()
  createdAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
