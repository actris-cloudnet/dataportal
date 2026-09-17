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
  | "fmi-radar"
  | "other";

export type LabellingStatus = "planned" | "initially-accepted" | "labelled";

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
  wigosName: string | null;
  dvasId: string | null;
  dvasName: string | null;
  actrisId: number | null;
  actrisName: string | null;
  labellingStatus: LabellingStatus | null;
  country: string | null;
  countryCode: string | null;
  countrySubdivisionCode: string | null;
  contacts: Contact[];
  status: "cloudnet" | "active" | "inactive";
}

export type { Contact as SiteContact } from "./Contact";
