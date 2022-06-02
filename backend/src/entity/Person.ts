import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { SiteContact } from "./SiteContact";

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  firstname?: string;

  @Column()
  surname?: string;

  @Column({ unique: true, nullable: true })
  orcid?: string;

  @OneToMany(() => SiteContact, (siteContact) => siteContact.person)
  siteContactRoles?: SiteContact[];
}
