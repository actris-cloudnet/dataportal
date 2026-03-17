import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Site } from "./Site";
import { Person } from "./Person";

@Entity()
export class SiteContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  siteId!: string;

  @ManyToOne(() => Site, { onDelete: "CASCADE" })
  @JoinColumn({ name: "siteId" })
  site!: Site;

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
