import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Site } from "./Site";

@Entity()
export class SiteLocation {
  @PrimaryColumn()
  siteId!: string;

  @ManyToOne((_) => Site, (site) => site.locations)
  site!: Site;

  @Column({ type: "timestamp", primary: true })
  date!: Date;

  @Column({ type: "float" })
  latitude!: number;

  @Column({ type: "float" })
  longitude!: number;
}
