import { Column, Entity, ManyToMany, PrimaryColumn, JoinTable } from "typeorm";
import { Site } from "./Site";
import { Model } from "./Model";
import { Person } from "./Person";

@Entity()
export class Citation {
  @PrimaryColumn()
  id!: string;

  @Column({ type: "text" })
  acknowledgements!: string;
}

@Entity()
export class RegularCitation extends Citation {
  @ManyToMany((_) => Site)
  sites!: Site[];

  @ManyToMany((_) => Person, (person) => person.citations)
  @JoinTable()
  persons!: Person[];
}

@Entity()
export class ModelCitation extends Citation {
  @ManyToMany((_) => Model)
  models!: Model[];
}
