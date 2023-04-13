import { Column, Entity, OneToMany, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { SiteContact } from "./SiteContact";
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

  @Column({ nullable: true })
  email?: string;

  @OneToMany(() => SiteContact, (siteContact) => siteContact.person)
  siteContactRoles?: SiteContact[];

  @ManyToMany((_) => Site, (site) => site.persons)
  sites?: Site[];

  @ManyToMany((_) => RegularCitation, (regularCitation) => regularCitation.persons)
  citations?: RegularCitation[];
}
