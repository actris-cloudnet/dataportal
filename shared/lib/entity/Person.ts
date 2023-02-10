import type { SiteContact } from "./SiteContact";
import type { Site } from "./Site";

export interface Person {
  id?: number;
  firstname?: string;
  surname?: string;
  orcid?: string;
  email?: string;
  siteContactRoles?: SiteContact[];
  sites?: Site[];
}
