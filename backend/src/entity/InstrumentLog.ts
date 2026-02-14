import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InstrumentInfo } from "./Instrument";
import { UserAccount } from "./UserAccount";

export enum InstrumentLogEventType {
  CALIBRATION = "calibration",
  CHECK = "check",
  INSTALLATION = "installation",
  MAINTENANCE = "maintenance",
  MALFUNCTION = "malfunction",
  NOTE = "note",
  REMOVAL = "removal",
}

@Entity()
export class InstrumentLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
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
  detail!: string | null;

  @Column({ type: "text", nullable: true })
  result!: string | null;

  @Column({ type: "timestamp without time zone", nullable: true })
  endDate!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ nullable: true })
  userAccountId!: number | null;

  @ManyToOne(() => UserAccount, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userAccountId" })
  userAccount!: UserAccount | null;

  @Column()
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  updatedAt!: Date | null;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
