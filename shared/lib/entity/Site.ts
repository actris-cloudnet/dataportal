import type { Person } from "./Person";

export type SiteType = "cloudnet" | "arm" | "campaign" | "mobile" | "test" | "model" | "hidden" | "ri-urbans";

export interface SiteLink<T> {
  id: T;
  name: string;
  uri: string;
}

export interface Site {
  id: string;
  humanReadableName: string;
  stationName: string | null;
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
  persons: Person[];
  status: "cloudnet" | "active" | "inactive";
  _dvas: SiteLink<string> | null;
  _actris: SiteLink<number> | null;
}
