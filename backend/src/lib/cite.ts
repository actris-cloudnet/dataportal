import { DataSource } from "typeorm";

import { RegularFile, ModelFile } from "../entity/File";
import { Collection } from "../entity/Collection";
import axios from "axios";
import { formatList, getCollectionLandingPage, getFileLandingPage, truncateList } from ".";
import env from "../lib/env";

const MODEL_AUTHOR: Person = { firstName: "Ewan", lastName: "O'Connor", orcid: "0000-0001-9834-5100", role: "modelPi" };
const UNKNOWN_AUTHOR: Person = { firstName: "", lastName: "CLU", orcid: null, role: "instrumentPi" };
const PUBLISHER = "ACTRIS Cloud remote sensing data centre unit (CLU)";
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COMMON_ACK = `We acknowledge ACTRIS and Finnish Meteorological Institute for providing the data set which is available for download from <a href="${env.DP_FRONTEND_URL}">${env.DP_FRONTEND_URL}</a>.`;

export interface Person {
  firstName: string;
  lastName: string;
  orcid: string | null;
  role: "instrumentPi" | "modelPi" | "nfPi";
}

export interface Location {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Citation {
  authors: Person[];
  publisher: string;
  title: string;
  year: number;
  url: string;
  note?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  locations: Location[];
}

interface InstrumentPi {
  first_name: string;
  last_name: string;
  orcid_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface NfContact {
  first_name: string;
  last_name: string;
  orcid_id: string | null;
  role: string;
  start_date: string | null;
  end_date: string | null;
}

export class CitationService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async getCollectionCitation(collection: Collection): Promise<Citation> {
    const [instrumentPis, usesModelData, nfPis, productNames, sites, dateRange] = await Promise.all([
      this.queryInstrumentPids(collection).then((pids) => fetchInstrumentPis(pids)),
      this.usesModelData(collection),
      this.queryCollectionActrisIds(collection).then((ids) => fetchNfPis(ids)),
      this.queryCollectionProductNames(collection),
      this.queryCollectionSites(collection),
      this.queryCollectionDateRange(collection),
    ]);
    if (usesModelData || productNames.includes("Model")) {
      instrumentPis.push(MODEL_AUTHOR);
    }
    const siteAuthors = await this.queryCollectionSitePersons(collection);
    const authors = removeDuplicateNames([...instrumentPis, ...nfPis, ...siteAuthors]);
    const allProducts = productNames.map(formatProductName);
    const truncatedProducts = truncateList(allProducts, 5, "products");
    let products = formatList(truncatedProducts, ", and ");
    if (allProducts.length === truncatedProducts.length) {
      products += " data";
    }
    const siteNames = sites.map((site) => site.name);
    const siteList = formatList(truncateList(siteNames, 5, "sites"), ", and ");
    const date = formatDateRange(dateRange.startDate, dateRange.endDate);
    const title = `Custom collection of ${products} from ${siteList} ${date}`;
    return {
      authors,
      publisher: PUBLISHER,
      title,
      year: collection.createdAt.getFullYear(),
      url: collection.pid || getCollectionLandingPage(collection),
      startDate: dateToString(dateRange.startDate),
      endDate: dateToString(dateRange.endDate),
      createdAt: dateToString(collection.createdAt),
      updatedAt: dateToString(collection.updatedAt),
      locations: sites,
    };
  }

  async getFileCitation(file: RegularFile | ModelFile): Promise<Citation> {
    let people: Person[];
    if (file instanceof RegularFile) {
      const [instrumentPis, nfPi, usesModelData] = await Promise.all([
        this.queryInstrumentPids(file).then((pids) => fetchInstrumentPis(pids)),
        file.site.actrisId
          ? fetchNfPi(file.site.actrisId, file.measurementDate as unknown as string)
          : Promise.resolve([]),
        this.usesModelData(file),
      ]);
      people = [
        ...instrumentPis,
        ...nfPi.map(
          (pi): Person => ({
            firstName: pi.first_name,
            lastName: pi.last_name,
            orcid: pi.orcid_id ? normalizeOrcid(pi.orcid_id) : null,
            role: "nfPi",
          }),
        ),
      ];
      if (usesModelData) {
        people.push(MODEL_AUTHOR);
      }
      people = people.concat(
        file.site.citations
          .flatMap((citation) => citation.persons)
          .map((person) => ({
            firstName: person.firstname,
            lastName: person.surname,
            orcid: person.orcid ? normalizeOrcid(person.orcid) : null,
            role: "nfPi",
          })),
      );
    } else {
      people = [MODEL_AUTHOR];
    }
    return {
      authors: removeDuplicateNames(people),
      publisher: PUBLISHER,
      title: `${file.product.humanReadableName} data from ${file.site.humanReadableName} on ${humanReadableDate(
        file.measurementDate,
      )}`,
      year: file.updatedAt.getFullYear(),
      url: file.pid || getFileLandingPage(file),
      note: file.volatile ? "Data is volatile and may be updated in the future" : undefined,
      startDate: dateToString(file.measurementDate),
      endDate: dateToString(file.measurementDate),
      createdAt: dateToString(file.createdAt),
      updatedAt: dateToString(file.updatedAt),
      locations: [],
    };
  }

  async getAcknowledgements(object: RegularFile | ModelFile | Collection): Promise<string> {
    const [siteAcks, modelAcks] = await Promise.all([this.querySiteAcks(object), this.queryModelAcks(object)]);
    let output = COMMON_ACK;
    if (siteAcks.length > 0) {
      output += " ";
      output += siteAcks.join(" ");
    }
    if (modelAcks.length > 0) {
      output += " We acknowledge ";
      output += formatList(
        modelAcks.map((a) => a.replace(/\.$/, "")),
        ", and ",
      );
      output += ".";
    }
    return output;
  }

  private queryInstrumentPids(object: RegularFile | Collection): Promise<{ instrumentPid: string; dates: string[] }[]> {
    return this.querySourceFiles(
      object,
      `SELECT instrument_info.pid AS "instrumentPid", array_agg(regular_file."measurementDate"::text) AS dates
       FROM traverse
       JOIN regular_file ON traverse.uuid = regular_file.uuid
       JOIN instrument_info ON regular_file."instrumentInfoUuid" = instrument_info.uuid
       WHERE instrument_info.pid IS NOT NULL
       GROUP BY instrument_info.pid`,
    );
  }

  private async usesModelData(object: RegularFile | Collection): Promise<boolean> {
    const rows = await this.querySourceFiles(
      object,
      `SELECT 1
       FROM traverse
       JOIN regular_file_source_model_files_model_file source_model_file ON traverse.uuid = source_model_file."regularFileUuid"
       LIMIT 1`,
    );
    return rows.length > 0;
  }

  private async queryCollectionActrisIds(collection: Collection): Promise<{ actrisId: number; dates: string[] }[]> {
    return await this.dataSource.query(
      `SELECT "actrisId", array_agg(regular_file."measurementDate"::text) AS dates
       FROM regular_file
       JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
       JOIN site ON regular_file."siteId" = site.id
       WHERE "collectionUuid" = $1
       AND "actrisId" IS NOT NULL
       GROUP BY "actrisId"`,
      [collection.uuid],
    );
  }

  private async queryCollectionProductNames(collection: Collection): Promise<string[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT product."humanReadableName"
       FROM regular_file
       JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
       JOIN product ON regular_file."productId" = product.id
       WHERE "collectionUuid" = $1
       UNION
       SELECT 'Model' AS "humanReadableName"
       FROM model_file
       JOIN collection_model_files_model_file ON model_file.uuid = "modelFileUuid"
       WHERE "collectionUuid" = $1`,
      [collection.uuid],
    );
    return rows.map((row) => row.humanReadableName).sort();
  }

  private async queryCollectionSites(collection: Collection): Promise<Location[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT site."humanReadableName", site."latitude", site."longitude"
       FROM regular_file
       JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
       JOIN site ON regular_file."siteId" = site.id
       WHERE "collectionUuid" = $1
       UNION
       SELECT site."humanReadableName", site."latitude", site."longitude"
       FROM model_file
       JOIN collection_model_files_model_file ON model_file.uuid = "modelFileUuid"
       JOIN site ON model_file."siteId" = site.id
       WHERE "collectionUuid" = $1`,
      [collection.uuid],
    );
    return rows
      .map((row) => ({
        name: row.humanReadableName,
        latitude: row.latitude,
        longitude: row.longitude,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async queryCollectionSitePersons(collection: Collection): Promise<Person[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT DISTINCT firstname, surname, orcid
       FROM regular_file
       JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
       JOIN site_citations_regular_citation USING ("siteId")
       JOIN regular_citation_persons_person USING ("regularCitationId")
       JOIN person ON "personId" = person.id
       WHERE "collectionUuid" = $1`,
      [collection.uuid],
    );
    return rows.map(
      (row): Person => ({
        firstName: row.firstname,
        lastName: row.surname,
        orcid: row.orcid ? normalizeOrcid(row.orcid) : null,
        role: "nfPi",
      }),
    );
  }

  private async queryCollectionDateRange(collection: Collection): Promise<{ startDate: Date; endDate: Date }> {
    const rows = await this.dataSource.query(
      `SELECT MIN("measurementDate") AS "startDate", MAX("measurementDate") AS "endDate"
       FROM (SELECT "measurementDate"
             FROM regular_file
             JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
             WHERE "collectionUuid" = $1
             UNION
             SELECT "measurementDate"
             FROM model_file
             JOIN collection_model_files_model_file ON model_file.uuid = "modelFileUuid"
             WHERE "collectionUuid" = $1) AS dates`,
      [collection.uuid],
    );
    return rows[0];
  }

  private async queryModelAcks(object: RegularFile | ModelFile | Collection): Promise<string[]> {
    if (object instanceof ModelFile) {
      return object.model.citations.map((r) => r.acknowledgements);
    }
    const rows: any[] = await this.querySourceFiles(
      object,
      `SELECT DISTINCT acknowledgements
       FROM traverse
       JOIN regular_file_source_model_files_model_file source_model_file ON traverse.uuid = source_model_file."regularFileUuid"
       JOIN model_file ON source_model_file."modelFileUuid" = model_file.uuid
       JOIN model_citations_model_citation ON model_file."modelId" = model_citations_model_citation."modelId"
       JOIN model_citation ON model_citations_model_citation."modelCitationId" = model_citation.id`,
    );
    return rows.map((row) => row.acknowledgements);
  }

  private async querySiteAcks(object: RegularFile | ModelFile | Collection): Promise<string[]> {
    if (object instanceof RegularFile) {
      return object.site.citations.map((r) => r.acknowledgements);
    }
    if (object instanceof ModelFile) {
      return [];
    }
    const rows: any[] = await this.dataSource.query(
      `SELECT DISTINCT acknowledgements
       FROM regular_file
       JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
       JOIN site_citations_regular_citation ON regular_file."siteId" = site_citations_regular_citation."siteId"
       JOIN regular_citation ON site_citations_regular_citation."regularCitationId" = regular_citation.id
       WHERE "collectionUuid" = $1`,
      [object.uuid],
    );
    return rows.map((row) => row.acknowledgements);
  }

  private async querySourceFiles(object: RegularFile | Collection, query: string): Promise<any> {
    const filter =
      object instanceof Collection
        ? `JOIN collection_regular_files_regular_file ON regular_file.uuid = "regularFileUuid"
           WHERE "collectionUuid" = $1`
        : `WHERE uuid = $1`;
    return await this.dataSource.query(
      `WITH RECURSIVE traverse AS (
         SELECT uuid
         FROM regular_file
         ${filter}
         UNION ALL
         SELECT "regularFileUuid_2"
         FROM regular_file_source_regular_files_regular_file
         JOIN traverse ON "regularFileUuid_1" = traverse.uuid
       )
       ${query}`,
      [object.uuid],
    );
  }
}

async function fetchInstrumentPi(pid: string, measurementDate?: Date): Promise<InstrumentPi[]> {
  const match = pid.match("^https?://hdl\\.handle\\.net/(.+)");
  if (!match) {
    throw new Error("Invalid PID format");
  }
  const url = `${env.HANDLE_API_URL}/handles/${match[1]}`;
  const response = await axios.get(url);
  const values = response.data.values;
  if (!Array.isArray(values)) {
    throw new Error("Invalid PID response");
  }
  const nameItem = values.find((ele) => ele.type === "URL");
  let apiUrl = nameItem.data.value + "/pi";
  if (measurementDate) {
    apiUrl += "?date=" + dateToString(measurementDate);
  }
  const apiRes = await axios.get(apiUrl);
  return apiRes.data;
}

async function fetchInstrumentPis(data: { instrumentPid: string; dates: string[] }[]): Promise<Person[]> {
  return (
    await Promise.all(
      data.map((item) =>
        fetchInstrumentPi(item.instrumentPid).then((pis) => {
          const output = new Set<InstrumentPi>();
          for (const date of item.dates) {
            pis
              .filter(
                (pi) =>
                  (pi.start_date != null ? date >= pi.start_date : true) &&
                  (pi.end_date != null ? date <= pi.end_date : true),
              )
              .forEach((pi) => {
                output.add(pi);
              });
          }
          return Array.from(
            output,
            (pi): Person => ({
              firstName: pi.first_name,
              lastName: pi.last_name,
              orcid: pi.orcid_id ? normalizeOrcid(pi.orcid_id) : null,
              role: "instrumentPi",
            }),
          );
        }),
      ),
    )
  ).flat();
}

async function fetchNfPi(actrisId: number, measurementDate?: string): Promise<NfContact[]> {
  const response = await axios.get(`${env.LABELLING_URL}/api/facilities/${actrisId}/contacts`, {
    params: {
      date: measurementDate,
      role: "pi",
    },
  });
  if (!Array.isArray(response.data)) {
    return [];
  }
  return response.data;
}

async function fetchNfPis(data: { actrisId: number; dates: string[] }[]): Promise<Person[]> {
  return (
    await Promise.all(
      data.map((item) =>
        fetchNfPi(item.actrisId).then((contacts) => {
          const output = new Set<InstrumentPi>();
          for (const date of item.dates) {
            contacts
              .filter(
                (contact) =>
                  contact.role === "pi" &&
                  (contact.start_date != null ? date >= contact.start_date : true) &&
                  (contact.end_date != null ? date <= contact.end_date : true),
              )
              .forEach((pi) => {
                output.add(pi);
              });
          }
          return Array.from(
            output,
            (pi): Person => ({
              firstName: pi.first_name,
              lastName: pi.last_name,
              orcid: pi.orcid_id ? normalizeOrcid(pi.orcid_id) : null,
              role: "nfPi",
            }),
          );
        }),
      ),
    )
  ).flat();
}

function normalizeOrcid(orcid: string): string {
  return orcid.replace(/^(https?:\/\/)?(www\.)?orcid\.org\//, "");
}

function normalizeText(input: string): string {
  return input
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();
}

export function removeDuplicateNames(pis: Person[]): Person[] {
  // Order
  const allPis = pis
    .sort((a, b) =>
      a.lastName !== b.lastName
        ? a.lastName.localeCompare(b.lastName, "en-gb")
        : a.firstName.localeCompare(b.firstName, "en-gb"),
    )
    .filter((ele) => ele.role == "instrumentPi")
    .concat(pis.filter((ele) => ele.role == "modelPi"))
    .concat(pis.filter((ele) => ele.role == "nfPi"));
  // Remove duplicates
  const out: Person[] = [];
  for (const pi of allPis) {
    const nameExists = pi.orcid
      ? out.some((name) => name.orcid === pi.orcid)
      : out.some(
          (name) =>
            normalizeText(name.firstName) === normalizeText(pi.firstName) &&
            normalizeText(name.lastName) === normalizeText(pi.lastName),
        );
    if (!nameExists) {
      out.push(pi);
    }
  }
  // DataCite requires at least one author.
  if (out.length === 0) {
    out.push(UNKNOWN_AUTHOR);
  }
  return out;
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const sameDate = startDate.getDate() == endDate.getDate();
  const sameMonth = startDate.getMonth() == endDate.getMonth();
  const sameYear = startDate.getFullYear() == endDate.getFullYear();
  if (sameYear && sameMonth && sameDate) {
    return "on " + startDate.getDate() + " " + MONTHS_ABBR[startDate.getMonth()] + " " + startDate.getFullYear();
  }
  let output = "between " + startDate.getDate();
  if (!sameMonth || !sameYear) {
    output += " " + MONTHS_ABBR[startDate.getMonth()];
  }
  if (!sameYear) {
    output += " " + startDate.getFullYear();
  }
  return output + " and " + endDate.getDate() + " " + MONTHS_ABBR[endDate.getMonth()] + " " + endDate.getFullYear();
}

function humanReadableDate(date: Date): string {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

const capitalWords = ["Doppler", "MWR", "(Voodoo)", "L3"];

function formatProductName(product: string) {
  return product
    .split(" ")
    .map((word) => (capitalWords.includes(word) ? word : word.toLowerCase()))
    .join(" ");
}

function dateToString(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}
