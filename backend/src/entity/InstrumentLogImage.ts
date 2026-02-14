import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstrumentLog } from "./InstrumentLog";

@Entity()
export class InstrumentLogImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  instrumentLogId!: number;

  @ManyToOne(() => InstrumentLog, { onDelete: "CASCADE" })
  @JoinColumn({ name: "instrumentLogId" })
  instrumentLog!: InstrumentLog;

  @Column({ unique: true })
  s3key!: string;

  @Column()
  filename!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column()
  createdAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
