import axios from "axios";

import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import type { Product } from "@shared/entity/Product";
import type { CollectionFileResponse } from "@shared/entity/CollectionFileResponse";
import type { Site, SiteType } from "@shared/entity/Site";

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
import haloDopplerLidarIcon from "@/assets/icons/halo-doppler-lidar.svg";

import markerIconRed from "@/assets/markers/marker-icon-red.png";
import markerIconBlue from "@/assets/markers/marker-icon-blue.png";
import markerIconViolet from "@/assets/markers/marker-icon-violet.png";
import markerIconOrange from "@/assets/markers/marker-icon-orange.png";
import markerIconGrey from "@/assets/markers/marker-icon-grey.png";

export const actrisNfUrl = "https://actris-nf-labelling.out.ocp.fmi.fi";

export const getQcText = (errorLevel: string) => {
  errorLevel = errorLevel != "info" ? errorLevel + "s" : errorLevel;
  return "Some " + errorLevel + ", ";
};

export const getQcLink = (uuid: string) => {
  return { name: "FileQualityReport", params: { uuid: `${uuid}` } };
};

const productIcons: Record<string, string> = {
  categorize: categorizeIcon,
  "categorize-voodoo": categorizeVoodooIcon,
  classification: classificationIcon,
  "classification-voodoo": classificationVoodooIcon,
  der: derIcon,
  disdrometer: disdrometerIcon,
  drizzle: drizzleIcon,
  ier: ierIcon,
  iwc: iwcIcon,
  "l3-cf": l3CfIcon,
  "l3-iwc": l3IwcIcon,
  "l3-lwc": l3LwcIcon,
  lidar: lidarIcon,
  lwc: lwcIcon,
  model: modelIcon,
  mwr: mwrIcon,
  radar: radarIcon,
  "weather-station": weatherStationIcon,
  "halo-doppler-lidar": haloDopplerLidarIcon,
};

export const getProductIcon = (product: Product | string) => {
  const id = typeof product == "string" ? product : product.id;
  return productIcons[id] || unknownIcon;
};

export const humanReadableSize = (size: number) => {
  if (size == 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${
    ["B", "kB", "MB", "GB", "TB"][i]
  }`;
};

export const humanReadableDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const humanReadableTimestamp = (date: string | Date) => {
  const [timestamp, suffix] = date.toString().replace("T", " ").split(".");
  return suffix.includes("Z") ? `${timestamp} UTC` : timestamp;
};

export const combinedFileSize = (files: SearchFileResponse[]) =>
  files.map((file) => file.size).reduce((prev, cur) => cur + prev, 0);

export const dateToUTC = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000);

export const dateToString = (date: Date) => {
  const utcTime = dateToUTC(date);
  return utcTime.toISOString().slice(0, 10);
};

export const sortVisualizations = (visualizations: VisualizationItem[]) => {
  return visualizations
    .concat()
    .sort((a: VisualizationItem, b: VisualizationItem) => {
      if (a.productVariable.order == b.productVariable.order) return 0;
      if (a.productVariable.order < b.productVariable.order) return -1;
      return 1;
    });
};

export const fixedRanges = Object.freeze({ week: 6, month: 29, day: 0 });

export function getDateFromBeginningOfYear(): Date {
  const currentYear = new Date().getFullYear().toString();
  return new Date(`${currentYear}-01-01`);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function constructTitle(files: CollectionFileResponse[]) {
  return files.map((file) => ({
    ...file,
    title: `${file.product} from ${file.site}`,
  }));
}

export const idToHumanReadable = (id: string) => {
  if (id.length < 4) return id.toUpperCase();
  return id.charAt(0).toUpperCase() + id.slice(1);
};

export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
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
  return (
    !isNaN(date.getDate()) && date.getTime() > new Date("1970-01-01").getTime()
  );
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

export async function fetchInstrumentName(pid: string): Promise<string> {
  const match = pid.match("^https?://hdl\\.handle\\.net/(.+)");
  if (!match) {
    throw new Error("Invalid PID format");
  }
  const url = "https://hdl.handle.net/api/handles/" + match[1];
  const response = await axios.get(url);

  const values = response.data.values;
  if (!Array.isArray(values)) {
    throw new Error("Invalid PID response");
  }

  const nameItem = values.find(
    (ele) => ele.type === "21.T11148/709a23220f2c3d64d1e1"
  );
  if (
    !nameItem ||
    !nameItem.data ||
    nameItem.data.format !== "string" ||
    !nameItem.data.value
  ) {
    throw new Error("Invalid PID structure");
  }
  let nameValue = JSON.parse(nameItem.data.value);
  if (typeof nameValue !== "string") {
    throw new Error("Invalid PID content");
  }

  const typeItem = values.find(
    (ele) => ele.type === "21.T11148/f76ad9d0324302fc47dd"
  );
  if (
    typeItem &&
    typeItem.data &&
    typeItem.data.format === "string" &&
    typeItem.data.value
  ) {
    const typeValue = JSON.parse(typeItem.data.value);
    if (Array.isArray(typeValue) && typeValue.length > 0) {
      const firstValue = typeValue[0];
      if (
        firstValue &&
        firstValue.instrumentType &&
        firstValue.instrumentType.instrumentTypeName
      ) {
        nameValue += " " + firstValue.instrumentType.instrumentTypeName;
      }
    }
  }

  return nameValue;
}

export const markerColors: Record<SiteType, string> = {
  cloudnet: markerIconBlue,
  arm: markerIconViolet,
  campaign: markerIconOrange,
  mobile: markerIconGrey,
  test: markerIconGrey,
  hidden: markerIconGrey,
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
  | "all-data"
  | "all-raw"
  | "contains-info";
