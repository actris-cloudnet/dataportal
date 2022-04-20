import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { Site } from './Site'
import { Person } from './Person'

export enum RoleType {
  EXPERT = 'expert',
  SCIENTIST = 'scientist',
  TECHNICIAN = 'technician',
}

@Entity()
export class SiteContact {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  role!: RoleType;

  @Column()
  email!: string;

  @ManyToOne(() => Site, (site) => site.contacts)
  site!: Site;

  @ManyToOne(() => Person, (person) => person.siteContactRoles)
  person!: Person;
}
