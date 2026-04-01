import type { Contact } from "./Contact";

export type SiteType =
  | "cloudnet"
  | "arm"
  | "campaign"
  | "mobile"
  | "test"
  | "model"
  | "hidden"
  | "ri-urbans"
  | "polarin"
  | "weather-radar"
  | "fmi-radar";

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
  wigosId: string | null;
  dvasId: string | null;
  actrisId: number | null;
  country: string | null;
  countryCode: string | null;
  countrySubdivisionCode: string | null;
  contacts: Contact[];
  status: "cloudnet" | "active" | "inactive";
}

export type { Contact as SiteContact } from "./Contact";

export interface SiteLinks {
  actris: SiteLink<number> | null;
  dvas: SiteLink<string> | null;
  wigos: SiteLink<string> | null;
}
