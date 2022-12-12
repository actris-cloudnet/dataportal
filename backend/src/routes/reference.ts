import { Connection, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";

import { RegularFile, ModelFile } from "../entity/File";
import axios from "axios";

interface Name {
  firstName: string;
  lastName: string;
  orcid?: string;
  role?: string;
}

interface Citation {
  citekey: string;
  author: Name[];
  publisher: string[];
  title: string;
  year: string;
  month: string;
  day: string;
  url: string;
  urldate: string;
  note: string;
}

const LABELLING_URL = "https://actris-nf-labelling.out.ocp.fmi.fi/api/facilities";
const MODEL_AUTHOR: Name = { firstName: "Ewan", lastName: "O'Connor", orcid: "0000-0001-9834-5100", role: "modelPi" };

export class ReferenceRoutes {
  private fileRepository: Repository<RegularFile>;
  private modelRepository: Repository<ModelFile>;

  constructor(conn: Connection) {
    this.fileRepository = conn.getRepository<RegularFile>("regular_file");
    this.modelRepository = conn.getRepository<ModelFile>("model_file");
  }

  getReference: RequestHandler = async (req, res, next) => {
    let data: RegularFile | ModelFile | undefined = await this.fileRepository.findOne(
      { uuid: req.params.uuid },
      { relations: ["site", "site.citations", "product"] }
    );
    if (!data) {
      data = await this.modelRepository.findOne(
        { uuid: req.params.uuid },
        { relations: ["site", "site.citations", "product", "model", "model.citations"] }
      );
    }
    if (data === undefined) {
      return next({ status: 404, errors: "UUID not found" });
    }
    if (req.query.acknowledgements === "true") {
      await getAcknowledgements(req, res, data);
    } else if (req.query.dataAvailability === "true") {
      await getDataAvailability(req, res, data);
    } else {
      const sourceUuids: string[] = [];
      await this.fetchSourceUuids(data, sourceUuids);
      let pis: any = await Promise.all([getSitePI(data), getInstrumentPis(sourceUuids, data.measurementDate)]);
      // This flattens nested arrays
      pis = [].concat(...[].concat(...pis)); // TODO: Rewrite this !!!!
      pis = removeDuplicateNames(pis);
      await getCitation(req, res, data, pis);
    }
  };

  async fetchSourceUuids(data: any, acc: any) {
    if (data.sourceFileIds) {
      for (const uuid of data.sourceFileIds) {
        const new_data = (await this.fileRepository.findOne(uuid)) || (await this.modelRepository.findOne(uuid));
        await this.fetchSourceUuids(new_data, acc);
      }
    } else {
      if (data.instrumentPid) {
        acc.push(data.instrumentPid);
      } else if (data instanceof ModelFile) {
        acc.push("model"); // modelPid does not exist yet
      }
    }
  }
}

async function getCitation(req: Request, res: Response, data: RegularFile | ModelFile, pis: Name[]) {
  const datestr = humanReadableDate(data.measurementDate as unknown as string);
  const [year, month, day] = yearMonthDay(data.updatedAt as unknown as string);
  const citekey = `${capitalize(data.site.id)}${capitalize(data.product.id)}${year}${month}${day}`;
  const citation = {
    citekey: citekey,
    author: formatAuthor(data, pis),
    publisher: ["ACTRIS Cloud remote sensing data centre unit (CLU)"],
    title: `${data.product.humanReadableName} data from ${data.site.humanReadableName} on ${datestr}`,
    year: year,
    month: month,
    day: day,
    url: data.pid ? data.pid : getCloudnetUrl(data.uuid),
    urldate: todayIsoString(),
    note: data.volatile ? "Data is volatile and may be updated in the future" : "",
  };
  if (req.query.format && req.query.format === "bibtex") {
    res.setHeader("Content-type", "text/plain");
    res.setHeader("Content-Disposition", `inline; filename="${citekey}.bib"`);
    res.send(citation2bibtex(citation));
  } else if (req.query.format && req.query.format === "ris") {
    res.setHeader("Content-type", "text/plain");
    res.setHeader("Content-Disposition", `inline; filename="${citekey}.ris"`);
    res.send(citation2ris(citation));
  } else if (req.query.format && req.query.format === "html") {
    res.setHeader("Content-type", "text/plain");
    res.send(citation2html(citation));
  } else {
    res.json(citation);
  }
}

function formatAuthor(data: RegularFile | ModelFile, pis: Name[]): Name[] {
  if (data instanceof ModelFile) {
    return [MODEL_AUTHOR];
  } else {
    const sitePis: Name[] = pis.filter((a: Name) => a.role == "pi");
    const InstrumentPis: Name[] = pis.filter((a: Name) => a.role != "pi");
    return InstrumentPis.concat(sitePis);
  }
}

async function getAcknowledgements(req: Request, res: Response, data: RegularFile | ModelFile) {
  const commonAck = commonAcknowledgement();
  const specificAck =
    data instanceof ModelFile
      ? data.model.citations.map((r) => r.acknowledgements)
      : data.site.citations.map((r) => r.acknowledgements);
  const combinedAck = [commonAck].concat(specificAck);
  const combinedAckStr = combinedAck.join(" ");
  if (req.query.format && req.query.format === "html") {
    res.send(combinedAckStr);
  } else if (req.query.format && req.query.format === "plain") {
    res.setHeader("Content-type", "text/plain");
    res.send(combinedAckStr);
  } else {
    res.json(combinedAck);
  }
}

function commonAcknowledgement() {
  const url = "https://cloudnet.fmi.fi/";
  const ackstr = `
    We acknowledge ACTRIS and Finnish Meteorological Institute for providing the data set which is available for download from <a href="${url}">${url}</a>.
  `;
  return ackstr.replace(/\s\s+/g, " ").trim();
}

async function getDataAvailability(req: Request, res: Response, data: RegularFile | ModelFile) {
  const url = data.pid ? data.pid : getCloudnetUrl(data.uuid);
  const datastr = `
    The data used in this study are generated by the Aerosol, Clouds and Trace Gases Research Infrastructure (ACTRIS) and are available from the ACTRIS Data Centre using the following link: <a href="${url}">${url}</a>.
  `;
  res.send(datastr.replace(/\s\s+/g, " ").trim());
}

async function getSitePI(data: RegularFile | ModelFile): Promise<Name[]> {
  const actrisId = data.site.actrisId;
  let names: Name[] = [];
  if (actrisId) {
    const response = await axios.get(`${LABELLING_URL}/${actrisId}/contacts`, {
      params: {
        date: data.measurementDate,
        role: "pi",
      },
    });
    if (response !== undefined) {
      names = response.data.map(
        (e: any): Name => ({ firstName: e.first_name, lastName: e.last_name, orcid: e.orcid_id, role: e.role })
      );
    }
  }
  return names;
}

async function getInstrumentPis(pids: string[], measurementDate: Date) {
  return await Promise.all(
    pids.map(async (pid: string) => {
      return await getInstrumentPi(pid, measurementDate);
    })
  );
}

async function getInstrumentPi(pid: string, measurementDate: Date): Promise<Name[]> {
  if (pid == "model") {
    return [MODEL_AUTHOR];
  }
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
  const nameItem = values.find((ele) => ele.type === "URL");
  const apiUrl = nameItem.data.value;
  const apiRes = await axios.get(`${apiUrl}/pi?date=${measurementDate}`);
  return apiRes.data.map(
    (e: any): Name => ({ firstName: e.first_name, lastName: e.last_name, orcid: e.orcid_id, role: "instrumentPi" })
  );
}

function capitalize(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function humanReadableDate(isodate: string) {
  const date = new Date(isodate);
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(date);
  return `${day} ${month} ${year}`;
}

function yearMonthDay(isodate: string) {
  const date = new Date(isodate);
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "2-digit" }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date);
  return [year, month, day];
}

function citation2bibtex(c: Citation) {
  const author = c.author.map((a) => `${a.lastName}, ${a.firstName}`).join(" and ");
  const publisher = c.publisher.join(", ");
  const note = c.note.length > 0 ? `note = {${c.note}},` : "";
  return `\
@misc{${c.citekey},
  author = {${author}},
  title = {${c.title}},
  year = {${c.year}},
  month = {${c.month}},
  day = {${c.day}},
  url = {${c.url}},
  urldate = {${c.urldate}},
  publisher = {${publisher}},
  licence = {${getCopyrightUrl()}},
  ${note}
}`.replace(/^\s*\n/gm, "");
}

function getInitials(name: string): string {
  return name.replace(/\p{L}+/gu, (part) => part.slice(0, 1) + ".");
}

function formatList(parts: string[]): string {
  if (parts.length <= 2) {
    return parts.join(", and ");
  }
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function citation2html(c: Citation) {
  let author = formatList(c.author.map((a) => `${a.lastName}, ${getInitials(a.firstName)}`));
  if (author.length > 0) {
    author = author.concat(" ");
  }
  const url = c.url.length > 0 ? `<a href="${c.url}">${c.url}</a>, ` : "";
  let publisher = c.publisher.join(", ");
  publisher = publisher.length > 0 ? publisher.concat(", ") : "";
  return `${author}"${c.title}", ${publisher}${url}${c.year}`;
}

function citation2ris(c: Citation) {
  const endl = "\r\n";
  let author = c.author.map((a) => `AU  - ${a.lastName}, ${a.firstName}`).join("\r\n");
  const publisher = c.publisher.join(", ");
  if (author == "") {
    author = "AU  - ";
  }
  return `\
TY  - DATA${endl}\
${author}${endl}\
T1  - ${c.title}${endl}\
PY  - ${c.year}/${c.month}/${c.day}${endl}\
PB  - ${publisher}${endl}\
UR  - ${c.url}${endl}\
Y2  - ${c.urldate}${endl}\
N1  - ${c.note}${endl}`;
}

function getCopyrightUrl() {
  return `https://creativecommons.org/licenses/by/4.0/`;
}

function getCloudnetUrl(uuid: string) {
  return `https://cloudnet.fmi.fi/file/${uuid}`;
}

function todayIsoString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function removeDuplicateNames(pis: Name[]): Name[] {
  // Order
  const allPis = pis
    .filter((ele) => ele.role == "instrumentPi")
    .concat(pis.filter((ele) => ele.role == "modelPi"))
    .concat(pis.filter((ele) => ele.role == "pi"));
  // Remove duplicates
  const out: Name[] = [];
  for (const pi of allPis) {
    const nameExists = pi.orcid
      ? out.some((name) => name.orcid === pi.orcid)
      : out.some((name) => name.firstName === pi.firstName && name.lastName === pi.lastName);
    if (!nameExists) {
      out.push(pi);
    }
  }
  return out;
}
