import axios from "axios";

import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";
import { SearchFileResponse } from "../../../backend/src/entity/SearchFileResponse";
import { Product } from "../../../backend/src/entity/Product";
import { CollectionFileResponse } from "../../../backend/src/entity/CollectionFileResponse";

export const actrisNfUrl = "https://actris-nf-labelling.out.ocp.fmi.fi";

export const getProductIcon = (product: Product | string) => {
  try {
    return require(`../assets/icons/${typeof product == "string" ? product : product.id}.png`);
  } catch (e) {
    return require("../assets/icons/unknown.png");
  }
};

export const humanReadableSize = (size: number) => {
  if (size == 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
};

export const humanReadableDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

export const humanReadableTimestamp = (date: string | Date) => {
  const [timestamp, suffix] = date.toString().replace("T", " ").split(".");
  return suffix.includes("Z") ? `${timestamp} UTC` : timestamp;
};

export const combinedFileSize = (files: SearchFileResponse[]) =>
  files.map((file) => file.size).reduce((prev, cur) => cur + prev, 0);

export const dateToUTC = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000);

export const dateToString = (date: Date) => {
  const utcTime = dateToUTC(date);
  return utcTime.toISOString().substring(0, 10);
};

export const sortVisualizations = (visualizations: VisualizationItem[]) => {
  return visualizations.concat().sort((a: VisualizationItem, b: VisualizationItem) => {
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function constructTitle(files: CollectionFileResponse[]) {
  return files.map((file) => ({ ...file, title: `${file.product} from ${file.site}` }));
}

export const idToHumanReadable = (id: string) => {
  if (id.length < 4) return id.toUpperCase();
  return id.charAt(0).toUpperCase() + id.slice(1);
};

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export function formatLatitude(latitude: number): string {
  return `${Math.abs(latitude)}°\u00a0${latitude > 0 ? "N" : "S"}`;
}

export function formatLongitude(longitude: number): string {
  return `${Math.abs(longitude)}°\u00a0${longitude > 0 ? "E" : "W"}`;
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

export function getQcIcon(errorLevel: string) {
  if (errorLevel === "error") {
    return require("../assets/icons/test-fail.svg");
  } else if (errorLevel === "warning") {
    return require("../assets/icons/test-warning.svg");
  }
  return require("../assets/icons/test-pass.svg");
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

  const nameItem = values.find((ele) => ele.type === "21.T11148/709a23220f2c3d64d1e1");
  if (!nameItem || !nameItem.data || nameItem.data.format !== "string" || !nameItem.data.value) {
    throw new Error("Invalid PID structure");
  }
  let nameValue = JSON.parse(nameItem.data.value);
  if (typeof nameValue !== "string") {
    throw new Error("Invalid PID content");
  }

  const typeItem = values.find((ele) => ele.type === "21.T11148/f76ad9d0324302fc47dd");
  if (typeItem && typeItem.data && typeItem.data.format === "string" && typeItem.data.value) {
    const typeValue = JSON.parse(typeItem.data.value);
    if (Array.isArray(typeValue) && typeValue.length > 0) {
      const firstValue = typeValue[0];
      if (firstValue && firstValue.instrumentType && firstValue.instrumentType.instrumentTypeName) {
        nameValue += " " + firstValue.instrumentType.instrumentTypeName;
      }
    }
  }

  return nameValue;
}
