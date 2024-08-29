import type { File } from "./File";
import type { Upload } from "./Upload";
import type { Calibration } from "./Calibration";
import type { RegularCitation } from "./Citation";
import type { Person } from "./Person";
import type { SiteLocation } from "./SiteLocation";

export enum SiteType {
  CLOUDNET = "cloudnet",
  ARM = "arm",
  CAMPAIGN = "campaign",
  MOBILE = "mobile",
  TEST = "test",
  HIDDEN = "hidden",
}

export interface Site {
  id: string;
  humanReadableName: string;
  description: string | null;
  type: SiteType[];
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  gaw: string | null;
  dvasId: string | null;
  actrisId: number | null;
  country: string | null;
  countryCode: string | null;
  countrySubdivisionCode: string | null;
  files: File[];
  uploads: Upload[];
  calibrations: Calibration[];
  persons: Person[];
  citations: RegularCitation[];
  locations: SiteLocation[];
  status: "cloudnet" | "active" | "inactive";
}
