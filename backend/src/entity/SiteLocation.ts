import { Column, Entity, ManyToOne } from "typeorm";
import { Site } from "./Site";

@Entity()
export class SiteLocation {
  @ManyToOne((_) => Site, (site) => site.locations, { primary: true })
  site!: Site;

  @Column({ type: "date", primary: true })
  date!: Date;

  @Column({ type: "float" })
  latitude!: number;

  @Column({ type: "float" })
  longitude!: number;
}
