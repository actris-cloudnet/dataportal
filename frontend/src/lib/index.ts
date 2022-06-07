import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";
import { SearchFileResponse } from "../../../backend/src/entity/SearchFileResponse";
import { Product } from "../../../backend/src/entity/Product";
import { CollectionFileResponse } from "../../../backend/src/entity/CollectionFileResponse";

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

export const humanReadableDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

export const humanReadableTimestamp = (date: string) => {
  const [timestamp, suffix] = date.replace("T", " ").split(".");
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

export const isValidDate = (obj: any) => {
  // eslint-disable-line  @typescript-eslint/no-explicit-any
  const date = new Date(obj);
  return !isNaN(date.getDate()) && date.getTime() > new Date("1970-01-01").getTime();
};
