import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstrumentInfo } from "./Instrument";
import { UserAccount } from "./UserAccount";

export enum InstrumentLogEventType {
  CALIBRATION = "calibration",
  MAINTENANCE = "maintenance",
  MALFUNCTION = "malfunction",
  FIRMWARE_UPDATE = "firmware-update",
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

  @Column({ type: "timestamp without time zone" })
  date!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ nullable: true })
  userAccountId!: number | null;

  @ManyToOne(() => UserAccount, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userAccountId" })
  userAccount!: UserAccount | null;

  @Column()
  createdAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
