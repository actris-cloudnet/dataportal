import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { RegularCitation } from "./Citation";
import { Permission } from "./Permission";
import { Person } from "./Person";
import { SiteLocation } from "./SiteLocation";

export enum SiteType {
  CLOUDNET = "cloudnet",
  ARM = "arm",
  CAMPAIGN = "campaign",
  RI_URBANS = "ri-urbans",
  MOBILE = "mobile",
  MODEL = "model",
  TEST = "test",
  HIDDEN = "hidden",
}

@Entity()
export class Site {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column({ type: "text", nullable: true })
  stationName!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column("text", { array: true })
  type!: string[];

  @Column({ type: "float", nullable: true })
  latitude!: number | null;

  @Column({ type: "float", nullable: true })
  longitude!: number | null;

  @Column({ type: "int", nullable: true })
  altitude!: number | null;

  @Column({ type: "char", length: 3, nullable: true })
  gaw!: string | null;

  @Column({ type: "text", nullable: true })
  dvasId!: string | null;

  @Column({ type: "smallint", nullable: true })
  actrisId!: number | null;

  @Column({ type: "text", nullable: true })
  country!: string | null;

  @Column({ type: "char", length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ type: "varchar", length: 6, nullable: true })
  countrySubdivisionCode!: string | null;

  @ManyToMany((_) => Person, (person) => person.sites)
  @JoinTable()
  persons!: Person[];

  @ManyToMany((_) => RegularCitation)
  @JoinTable()
  citations!: RegularCitation[];

  @OneToMany((_) => Permission, (permission) => permission.site)
  permissions!: Permission[];

  @OneToMany((_) => SiteLocation, (location) => location.site)
  locations!: SiteLocation[];

  get isTestSite() {
    return this.type.includes(SiteType.TEST);
  }

  get isHiddenSite() {
    return this.type.includes(SiteType.HIDDEN);
  }
}
