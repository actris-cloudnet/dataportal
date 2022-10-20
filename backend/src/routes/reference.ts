import { Connection, Repository } from "typeorm";
import { Request, RequestHandler, Response, NextFunction } from "express";

import { RegularFile, ModelFile } from "../entity/File";
import { Collection } from "../entity/Collection";
import axios from "axios";

const LABELLING_URL = "https://actris-nf-labelling.out.ocp.fmi.fi/api/facilities";

interface Name {
  first_name: string;
  last_name: string;
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

interface Reference {
  citation: Citation;
  acknowledgements: string;
  dataAvailability: string;
}

export class ReferenceRoutes {
  private fileRepository: Repository<RegularFile>;
  private modelRepository: Repository<ModelFile>;
  private collectionRepository: Repository<Collection>;

  constructor(conn: Connection) {
    this.fileRepository = conn.getRepository<RegularFile>("regular_file");
    this.modelRepository = conn.getRepository<ModelFile>("model_file");
    this.collectionRepository = conn.getRepository<Collection>("collection");
  }

  getReference: RequestHandler = async (req: Request, res: Response, next) => {
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
    const pi = await getPrincipalInvestigators(data).catch((err) => {
      return next({ status: 500, errors: err });
    });
    if (pi === undefined) {
      return next({ status: 500, errors: "Cannot get authors" });
    }
    if (req.query.acknowledgements === "true") {
      await getAcknowledgements(req, res, data);
      return;
    } else if (req.query.dataAvailability === "true") {
      await getDataAvailability(req, res, data);
      return;
    } else {
      await getCitation(req, res, data, pi);
      return;
    }
  };
}

async function getCitation(req: Request, res: Response, data: RegularFile | ModelFile, pi: Name[]) {
  const datestr = humanReadableDate(data.measurementDate as unknown as string);
  let author = [];
  let publisher = ["ACTRIS Cloud Remote Sensing Unit"];
  if (data instanceof ModelFile) {
    author = [{ first_name: "Ewan", last_name: "O'Connor" }];
  } else {
    author = pi.map((a: Name) => ({ first_name: a.first_name, last_name: a.last_name }));
  }
  const prod = data.product.humanReadableName;
  const site = data.site.humanReadableName;
  const title = `${prod} data from ${site} on ${datestr}`;
  const [year, month, day] = yearMonthDay(data.updatedAt as unknown as string);
  const citekey = `${capitalize(data.site.id)}${capitalize(data.product.id)}${year}${month}${day}`;
  const url = data.pid ? data.pid : getCloudnetUrl(data.uuid);
  const note = data.volatile ? "Data is volatile and may be updated in the future" : "";
  const citation = {
    citekey: citekey,
    author: author,
    publisher: publisher,
    title: title,
    year: year,
    month: month,
    day: day,
    url: url,
    urldate: todayIsoString(),
    note: note,
  };
  if (req.query.format && req.query.format === "bibtex") {
    res.setHeader("Content-type", "text/plain");
    //res.setHeader("Content-type", "application/x-bibtex");
    res.setHeader("Content-Disposition", `inline; filename="${citekey}.bib"`);
    const bibtexstr = citation2bibtex(citation);
    res.send(bibtexstr);
    return;
  } else if (req.query.format && req.query.format === "ris") {
    res.setHeader("Content-type", "text/plain");
    //res.setHeader("Content-type", "application/x-research-info-systems");
    res.setHeader("Content-Disposition", `inline; filename="${citekey}.ris"`);
    const risstr = citation2ris(citation);
    res.send(risstr);
    return;
  } else if (req.query.format && req.query.format === "html") {
    res.setHeader("Content-type", "text/plain");
    const htmlstr = citation2html(citation);
    res.send(htmlstr);
  } else {
    res.json(citation);
    return;
  }
}

async function getDataAvailability(req: Request, res: Response, data: RegularFile | ModelFile) {
  let avail = "";
  if (data.volatile) {
    avail = commonDataAvailabilityVolatileHtml(data);
  } else {
    avail = commonDataAvailabilityStableHtml(data);
  }
  res.send(avail);
}

async function getAcknowledgements(req: Request, res: Response, data: RegularFile | ModelFile) {
  let commonAck = commonAcknowledgement();
  let ack = [];
  if (data instanceof ModelFile) {
    let modelAck = data.model.citations.map((r) => r.acknowledgements);
    ack = [commonAck].concat(modelAck);
  } else {
    let siteAck = data.site.citations.map((r) => r.acknowledgements);
    ack = [commonAck].concat(siteAck);
  }
  let ackstr = ack.join(" ");
  if (req.query.format && req.query.format === "html") {
    res.send(urls2HtmlLinks(ackstr));
    return;
  } else if (req.query.format && req.query.format === "plain") {
    res.setHeader("Content-type", "text/plain");
    res.send(ack.join(" "));
    return;
  } else {
    res.json(ack);
    return;
  }
}

async function getPrincipalInvestigators(data: RegularFile | ModelFile): Promise<Name[]> {
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
      names = response.data.map((e: any) => ({ first_name: e.first_name, last_name: e.last_name }));
    }
  }
  return names;
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
  const author = c.author.map((a) => `${a.last_name}, ${a.first_name}`).join(" and ");
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

function citation2html(c: Citation) {
  let author = c.author.map((a) => `${a.last_name}, ${a.first_name}`).join(" and ");
  if (author.length > 0) {
    author = author.concat(": ");
  }
  const url = c.url.length > 0 ? urls2HtmlLinks(c.url).concat(", ") : "";
  let publisher = c.publisher.join(", ");
  publisher = publisher.length > 0 ? publisher.concat(", ") : "";
  return `${author}${c.title}, ${publisher}${url}${c.year}`;
}

function citation2ris(c: Citation) {
  const endl = "\r\n";
  let author = c.author.map((a) => `AU  - ${a.last_name}, ${a.first_name}`).join("\r\n");
  let publisher = c.publisher.join(", ");
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

function commonAcknowledgement() {
  let ackstr = `
    The Finnish Meteorological Institute for data processing.
  `;
  return ackstr.replace(/\s\s+/g, " ").trim();
}

function commonDataAvailabilityVolatileHtml(data: RegularFile | ModelFile) {
  const url = getCloudnetUrl(data.uuid);
  const datastr = `\
      The data is available at
      the Aerosol, Clouds and Trace Gases Research Infrastructure (ACTRIS) Data Centre :
      <a href="${url}">${url}</a>. The data is volatile and may be updated in the future.`;
  return datastr.replace(/\s\s+/g, " ").trim();
}
function commonDataAvailabilityStableHtml(data: RegularFile | ModelFile) {
  const pid = data.pid;
  const datastr = `\
      The data is available at
      the Aerosol, Clouds and Trace Gases Research Infrastructure (ACTRIS) Data Centre:
      <a href="${pid}">${pid}</a>.`;
  return datastr.replace(/\s\s+/g, " ").trim();
}

function urls2HtmlLinks(str: string) {
  const urlRegex = /((https?:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?(?<!\.))/g;
  return str.replace(urlRegex, '<a href="$1">$1</a>');
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
