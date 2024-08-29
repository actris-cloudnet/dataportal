import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { Site } from "./Site";
import { RegularCitation } from "./Citation";

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  firstname!: string;

  @Column()
  surname!: string;

  @Column({ unique: true, nullable: true })
  orcid?: string;

  @Column({ nullable: true, select: false })
  email?: string;

  @ManyToMany((_) => Site, (site) => site.persons)
  sites?: Site[];

  @ManyToMany((_) => RegularCitation, (regularCitation) => regularCitation.persons)
  citations?: RegularCitation[];
}
