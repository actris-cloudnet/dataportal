import type { Site } from "./Site";
import type { Person } from "./Person";

export enum RoleType {
  EXPERT = "expert",
  SCIENTIST = "scientist",
  TECHNICIAN = "technician",
  DATASUBMITTER = "dataSubmitter",
}

export interface SiteContact {
  id?: number;
  role: RoleType;
  site: Site;
  person: Person;
}
