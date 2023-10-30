import { FindOperator, ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { basename } from "path";
import { NextFunction, Request, Response } from "express";
import { ModelFile, RegularFile } from "../entity/File";
import { File } from "../entity/File";
import { SearchFileResponse } from "../entity/SearchFileResponse";
import { SearchFile } from "../entity/SearchFile";
import { Upload } from "../entity/Upload";
import axios from "axios";
import { SiteType } from "../entity/Site";
import env from "./env";
import { CollectionFileResponse } from "../entity/CollectionFileResponse";
import ReadableStream = NodeJS.ReadableStream;
import maxmind, { CountryResponse, OpenOpts, Reader } from "maxmind";
import { randomBytes } from "crypto";
import { Collection } from "../entity/Collection";

export const stringify = (obj: any): string => JSON.stringify(obj, null, 2);

const DATETIME_FORMAT =
  /^(?<year>\d\d\d\d)-(?<month>\d\d)-(?<day>\d\d)(T(?<hours>\d\d):(?<minutes>\d\d):(?<seconds>\d\d)(\.(?<fraction>\d+))?(Z|\+00:00)?)?$/;

export function isValidDate(obj: any): boolean {
  if (obj instanceof Date) {
    return !isNaN(obj.getTime());
  }
  if (typeof obj !== "string") {
    return false;
  }
  const match = DATETIME_FORMAT.exec(obj);
  if (!match || !match.groups) {
    return false;
  }
  const year = parseInt(match.groups.year);
  const month = parseInt(match.groups.month) - 1;
  const day = parseInt(match.groups.day);
  const hours = match.groups.hours ? parseInt(match.groups.hours) : 0;
  const minutes = match.groups.minutes ? parseInt(match.groups.minutes) : 0;
  const seconds = match.groups.seconds ? parseInt(match.groups.seconds) : 0;
  const milliseconds = match.groups.fraction ? parseInt(match.groups.fraction.slice(0, 3).padEnd(3, "0")) : 0;
  const date = new Date(year, month, day, hours, minutes, seconds, milliseconds);
  return (
    date.getFullYear() == year &&
    date.getMonth() == month &&
    date.getDate() == day &&
    date.getHours() == hours &&
    date.getMinutes() == minutes &&
    date.getSeconds() == seconds &&
    date.getMilliseconds() == milliseconds
  );
}

export const tomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

export const toArray = (obj: string | Array<string> | undefined): Array<string> | null => {
  if (!obj) return null;
  else if (typeof obj == "string") return [obj];
  return obj;
};

export const hideTestDataFromNormalUsers = <Entity extends ObjectLiteral>(
  dbQuery: SelectQueryBuilder<Entity>,
  req: Request,
): SelectQueryBuilder<Entity> =>
  req.query.developer !== undefined ? dbQuery : dbQuery.andWhere("not :type = ANY(site.type)", { type: SiteType.TEST });

export const convertToSearchResponse = (file: SearchFile) => new SearchFileResponse(file);

export const convertToReducedResponse = (parameters: (keyof SearchFileResponse)[]) => (file: SearchFile) =>
  parameters.reduce((acc, cur) => ({ ...acc, [cur]: convertToSearchResponse(file)[cur] }), {});

export const convertToCollectionFileResponse = (file: RegularFile | ModelFile) => new CollectionFileResponse(file);

export const sortByMeasurementDateAsc = <T extends File | SearchFile>(files: T[]): T[] =>
  files.sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());

export const augmentFile = (includeS3path: boolean) => (file: RegularFile | ModelFile) => ({
  ...file,
  downloadUrl: `${env.DP_BACKEND_URL}/download/${getDownloadPathForFile(file)}`,
  filename: basename(file.s3key),
  s3key: undefined,
  s3path: includeS3path ? getS3pathForFile(file) : undefined,
  model: "model" in file ? file.model : undefined,
  software: file.software
    ? file.software.map((software) => ({
        id: software.code,
        version: software.version,
        title: `${software.humanReadableName || software.code} ${software.version}`,
        url: software.url,
      }))
    : undefined,
  timeliness: calcTimeliness(file),
});

function calcTimeliness(file: RegularFile | ModelFile) {
  if (!file.stopTime) {
    const daysBetween = daysBetweenDates(file.updatedAt, file.measurementDate);
    return daysBetween <= 3 ? "nrt" : "scheduled";
  }
  const msInHour = 1000 * 60 * 60;
  const msInDay = msInHour * 24;
  const diff = file.updatedAt.getTime() - file.stopTime.getTime();
  if (diff < msInHour * 3) return "rrt";
  else if (diff < msInDay * 3) return "nrt";
  else return "scheduled";
}

export const ssAuthString = () =>
  "Basic " + // eslint-disable-line prefer-template
  Buffer.from(`${env.DP_SS_USER}:${env.DP_SS_PASSWORD}`).toString("base64");

export const getBucketForFile = (file: File) => (file.volatile ? "cloudnet-product-volatile" : "cloudnet-product");

export const getS3pathForUpload = (upload: Upload) =>
  `/cloudnet-upload/${upload.site.id}/${upload.uuid}/${upload.filename}`;

export const getS3pathForFile = (file: File) => `/${getBucketForFile(file)}/${file.s3key}`;

export const getS3pathForImage = (s3key: string) => `/cloudnet-img/${s3key}`;

export const getDownloadPathForFile = (file: File) => `product/${file.uuid}/${file.s3key}`;

export async function checkFileExists(s3path: string) {
  const headers = {
    Authorization: ssAuthString(),
  };
  return axios.head(`${env.DP_SS_URL}${s3path}`, { headers });
}

const translateKeyVal = (key: string, val: string | number | boolean | Date, acc: any, prefix: string) => {
  if (key == "file_siteId" || key == "file_productId") return {}; // Ignore unneeded fields
  const regexp = new RegExp(`^${prefix}_`);
  key = key.replace(regexp, "");
  val = val instanceof Date && key == "measurementDate" ? val.toISOString().split("T")[0] : val;
  let subKey;
  [key, ...subKey] = key.split("_");
  subKey = subKey.join("_");
  if (!subKey) return { [key]: val };
  else
    return {
      [key]: {
        ...acc[key],
        ...{ [subKey]: val },
      },
    };
};

export const transformRawFile = (obj: any, prefix: string): RegularFile | ModelFile | SearchFile => {
  return Object.keys(obj).reduce(
    (acc: { [key: string]: any }, key) => ({
      ...acc,
      ...translateKeyVal(key, obj[key], acc, prefix),
    }),
    {},
  ) as RegularFile | ModelFile | SearchFile;
};

export const dateforsize = async (
  repo: Repository<any>,
  table: string,
  req: Request,
  res: Response,
  _: NextFunction,
) => {
  const query = req.query as any;
  const startDate = new Date(query.startDate);
  const sizeBytes = parseInt(query.targetSize) * 1024 * 1024 * 1024;

  const result = await repo.query(
    `SELECT "updatedAt" FROM (
    SELECT "updatedAt", sum(size) OVER (ORDER BY "updatedAt")
    FROM ${table} where "updatedAt" > $1) as asd
  WHERE sum > $2 LIMIT 1`,
    [startDate, sizeBytes],
  );

  if (result.length == 0) return res.sendStatus(400);
  return res.send(result[0].updatedAt);
};

export function streamHandler(stream: ReadableStream, res: Response, prefix: string, augmenter?: Function) {
  res.header("content-type", "application/json");
  res.write("[");
  let objectSent = false;
  stream.on("data", (data) => {
    if (objectSent) res.write(",");
    else objectSent = true;
    const transformedFile = transformRawFile(data, prefix);
    const augmentedFile = augmenter ? augmenter(transformedFile) : transformedFile;
    res.write(JSON.stringify(augmentedFile));
  });
  stream.on("end", () => {
    res.write("]");
    res.end();
  });
}

export function getIpLookup(options?: OpenOpts): Promise<Reader<CountryResponse>> {
  return maxmind.open<CountryResponse>(env.GEOLITE2_COUNTRY_PATH, options);
}

export function randomString(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

export function validateInstrumentPid(input: any): string {
  if (typeof input !== "string") {
    return "must be string";
  }
  if (!input.startsWith("https://")) {
    return "must be HTTPS";
  }
  if (!input.startsWith("https://hdl.handle.net/")) {
    return "must be Handle";
  }
  return "";
}

export function getFileLandingPage(file: RegularFile | ModelFile): string {
  return `${env.DP_FRONTEND_URL}/file/${file.uuid}`;
}

export function getCollectionLandingPage(collection: Collection): string {
  return `${env.DP_FRONTEND_URL}/collection/${collection.uuid}`;
}

export function getObjectLandingPage(object: RegularFile | ModelFile | Collection): string {
  return object instanceof Collection ? getCollectionLandingPage(object) : getFileLandingPage(object);
}

export function truncateList(list: string[], limit: number, placeholder: string) {
  if (list.length < limit + 2) {
    return list;
  }
  return [...list.slice(0, limit), `${list.length - limit} other ${placeholder}`];
}

export function formatList(parts: string[], conjunction: string): string {
  if (parts.length <= 2) {
    return parts.join(conjunction);
  }
  return parts.slice(0, -1).join(", ") + conjunction + parts[parts.length - 1];
}

// TODO: Workaround for TypeORM 0.3
export function ArrayEqual<T>(value: T[] | FindOperator<T>): FindOperator<any> {
  return new FindOperator("equal", value as any);
}

function daysBetweenDates(a: Date, b: Date): number {
  a = new Date(a);
  b = new Date(b);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}
