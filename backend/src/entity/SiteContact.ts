import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Site } from "./Site";
import { Person } from "./Person";

export enum RoleType {
  EXPERT = "expert",
  SCIENTIST = "scientist",
  TECHNICIAN = "technician",
  DATASUBMITTER = "dataSubmitter",
}

@Entity()
export class SiteContact {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  role!: RoleType;

  @ManyToOne(() => Site, (site) => site.contacts, { nullable: false })
  site!: Site;

  @ManyToOne(() => Person, (person) => person.siteContactRoles, { nullable: false })
  person!: Person;
}
