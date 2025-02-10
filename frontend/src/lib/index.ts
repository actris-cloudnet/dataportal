import type { Product } from "@shared/entity/Product";
import type { Site, SiteType } from "@shared/entity/Site";
import type { Instrument } from "@shared/entity/Instrument";

import categorizeIcon from "@/assets/icons/categorize.png";
import categorizeVoodooIcon from "@/assets/icons/categorize-voodoo.png";
import classificationIcon from "@/assets/icons/classification.png";
import classificationVoodooIcon from "@/assets/icons/classification-voodoo.png";
import derIcon from "@/assets/icons/der.png";
import disdrometerIcon from "@/assets/icons/disdrometer.png";
import drizzleIcon from "@/assets/icons/drizzle.png";
import ierIcon from "@/assets/icons/ier.png";
import iwcIcon from "@/assets/icons/iwc.png";
import l3CfIcon from "@/assets/icons/l3-cf.png";
import l3IwcIcon from "@/assets/icons/l3-iwc.png";
import l3LwcIcon from "@/assets/icons/l3-lwc.png";
import lidarIcon from "@/assets/icons/lidar.png";
import lwcIcon from "@/assets/icons/lwc.png";
import modelIcon from "@/assets/icons/model.png";
import mwrIcon from "@/assets/icons/mwr.png";
import radarIcon from "@/assets/icons/radar.png";
import unknownIcon from "@/assets/icons/unknown.png";
import weatherStationIcon from "@/assets/icons/weather-station.png";
import dopplerLidarIcon from "@/assets/icons/doppler-lidar.svg";
import dopplerLidarWindIcon from "@/assets/icons/doppler-lidar-wind.svg";
import rainRadarIcon from "@/assets/icons/rain-radar.svg";
import rainGaugerIcon from "@/assets/icons/rain-gauge.png";
import cprSimulationIcon from "@/assets/icons/earthcare.png";

import markerIconRed from "@/assets/markers/marker-icon-red.png";
import markerIconBlue from "@/assets/markers/marker-icon-blue.png";
import markerIconViolet from "@/assets/markers/marker-icon-violet.png";
import markerIconOrange from "@/assets/markers/marker-icon-orange.png";
import markerIconGrey from "@/assets/markers/marker-icon-grey.png";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const vocabularyUrl = "https://vocabulary.actris.nilu.no/actris_vocab/";

export const getQcText = (errorLevel: string) => {
  errorLevel = errorLevel != "info" ? errorLevel + "s" : errorLevel;
  return "Some " + errorLevel + ", ";
};

export const getQcLink = (uuid: string) => {
  return { name: "FileQualityReport", params: { uuid: `${uuid}` } };
};

const productIcons: Record<string, string> = {
  "categorize": categorizeIcon,
  "categorize-voodoo": categorizeVoodooIcon,
  "classification": classificationIcon,
  "classification-voodoo": classificationVoodooIcon,
  "der": derIcon,
  "disdrometer": disdrometerIcon,
  "drizzle": drizzleIcon,
  "ier": ierIcon,
  "iwc": iwcIcon,
  "l3-cf": l3CfIcon,
  "l3-iwc": l3IwcIcon,
  "l3-lwc": l3LwcIcon,
  "lidar": lidarIcon,
  "lwc": lwcIcon,
  "model": modelIcon,
  "mwr": mwrIcon,
  "mwr-l1c": mwrIcon,
  "mwr-single": mwrIcon,
  "mwr-multi": mwrIcon,
  "radar": radarIcon,
  "weather-station": weatherStationIcon,
  "doppler-lidar": dopplerLidarIcon,
  "doppler-lidar-wind": dopplerLidarWindIcon,
  "rain-radar": rainRadarIcon,
  "rain-gauge": rainGaugerIcon,
  "cpr-simulation": cprSimulationIcon,
};

export const getProductIcon = (product: Product | string) => {
  const id = typeof product == "string" ? product : product.id;
  return productIcons[id] || unknownIcon;
};

export const getInstrumentIcon = (instrument: Instrument) => getProductIcon(instrument.type);

export const humanReadableSize = (size: number) => {
  if (size == 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
};

export const humanReadableDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const humanReadableTimestamp = (date: string | Date) => {
  const [timestamp, suffix] = date.toString().replace("T", " ").split(".");
  return suffix.includes("Z") ? `${timestamp} UTC` : timestamp;
};

/** Convert date to ISO 8601 date in UTC. */
export const dateToString = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const fixedRanges = Object.freeze({ week: 6, month: 29, day: 0 });

export function getDateFromBeginningOfYear(): Date {
  const currentYear = new Date().getFullYear().toString();
  return new Date(`${currentYear}-01-01`);
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export function formatLatitude(latitude: number): string {
  return `${Math.abs(latitude)}°${latitude > 0 ? "N" : "S"}`;
}

export function formatLongitude(longitude: number): string {
  return `${Math.abs(longitude)}°${longitude > 0 ? "E" : "W"}`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${formatLatitude(latitude)}, ${formatLongitude(longitude)}`;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const isValidDate = (obj: any) => {
  const date = new Date(obj);
  return !isNaN(date.getDate()) && date.getTime() > new Date("1970-01-01").getTime();
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function compareValues(a: any, b: any): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

import testFailIcon from "@/assets/icons/test-fail.svg";
import testWarningIcon from "@/assets/icons/test-warning.svg";
import testInfoIcon from "@/assets/icons/test-info.svg";
import testPassIcon from "@/assets/icons/test-pass.svg";

export function getQcIcon(errorLevel: string) {
  if (errorLevel === "error") {
    return testFailIcon;
  } else if (errorLevel === "warning") {
    return testWarningIcon;
  } else if (errorLevel == "info") {
    return testInfoIcon;
  }
  return testPassIcon;
}

export const markerColors: Record<SiteType, string> = {
  "cloudnet": markerIconBlue,
  "arm": markerIconViolet,
  "campaign": markerIconOrange,
  "mobile": markerIconGrey,
  "test": markerIconGrey,
  "model": markerIconGrey,
  "hidden": markerIconGrey,
  "ri-urbans": markerIconGrey,
};

export function getMarkerIcon(site: Site, selected = false) {
  if (selected) return markerIconRed;
  return markerColors[site.type[0]];
}

export type ColorClass =
  | "no-data"
  | "only-legacy-data"
  | "contains-errors"
  | "contains-warnings"
  | "only-model-data"
  | "some-data"
  | "all-data"
  | "all-raw"
  | "contains-info"
  | "green1"
  | "green2"
  | "green3"
  | "green4";

export const classColor: Record<ColorClass, string> = {
  "no-data": "white",
  "all-data": "#5ac413",
  "all-raw": "#a0df7b",
  "some-data": "#7dd247",
  "only-legacy-data": "#9fb4c4",
  "contains-warnings": "#f7e91b",
  "contains-errors": "#cd5c5c",
  "contains-info": "#a0df7b",
  "only-model-data": "#d3d3d3",
  "green1": "rgb(155, 233, 168)",
  "green2": "rgb(64, 196, 99)",
  "green3": "rgb(48, 161, 78)",
  "green4": "rgb(33, 110, 57)",
};

export const nValidValues = (data: any[]) => data.filter((value) => value !== null && value !== undefined).length;
