import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { InstrumentInfo } from "./Instrument";
import { Person } from "./Person";

@Entity()
@Unique(["instrumentInfoUuid", "personId"])
export class InstrumentContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  instrumentInfoUuid!: string;

  @ManyToOne(() => InstrumentInfo, { onDelete: "CASCADE" })
  @JoinColumn({ name: "instrumentInfoUuid" })
  instrumentInfo!: InstrumentInfo;

  @Column()
  personId!: number;

  @ManyToOne(() => Person, { onDelete: "CASCADE" })
  @JoinColumn({ name: "personId" })
  person!: Person;

  @Column({ type: "date", nullable: true })
  startDate!: string | null;

  @Column({ type: "date", nullable: true })
  endDate!: string | null;

  @Column()
  createdAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
