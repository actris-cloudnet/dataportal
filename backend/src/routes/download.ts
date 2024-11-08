import { Request, RequestHandler } from "express";
import { CountryResponse, Reader } from "maxmind";
import { readFileSync } from "fs";

import { Collection } from "../entity/Collection";
import { DataSource, Not, Repository } from "typeorm";
import { File } from "../entity/File";
import { Status, Upload } from "../entity/Upload";
import { Download, ObjectType } from "../entity/Download";
import {
  getS3pathForFile,
  getS3pathForImage,
  getS3pathForUpload,
  ssAuthString,
  getCollectionLandingPage,
} from "../lib";
import * as http from "http";
import { IncomingMessage } from "http";
import archiver = require("archiver");
import { FileRoutes } from "./file";
import env from "../lib/env";
import { CollectionRoutes } from "./collection";
import { UploadRoutes } from "./upload";
import { CitationService } from "../lib/cite";
import { citation2txt } from "./reference";

const LICENSE_TEXT = readFileSync("data/CC-BY-4.0.txt");

export class DownloadRoutes {
  constructor(
    dataSource: DataSource,
    fileController: FileRoutes,
    collController: CollectionRoutes,
    uploadController: UploadRoutes,
    ipLookup: Reader<CountryResponse>,
  ) {
    this.downloadRepo = dataSource.getRepository(Download);
    this.fileController = fileController;
    this.collController = collController;
    this.uploadController = uploadController;
    this.ipLookup = ipLookup;
    this.citationService = new CitationService(dataSource);
  }

  readonly downloadRepo: Repository<Download>;
  readonly fileController: FileRoutes;
  readonly uploadController: UploadRoutes;
  readonly collController: CollectionRoutes;
  readonly ipLookup: Reader<CountryResponse>;
  readonly citationService: CitationService;

  product: RequestHandler = async (req, res, next) => {
    const s3key = (req.params.s3key as unknown as string[]).join("/");
    const file = await this.fileController.findAnyFile((repo) => repo.findOneBy({ uuid: req.params.uuid, s3key }));
    if (!file) return next({ status: 404, errors: ["File not found"] });
    const upstreamRes = await this.makeFileRequest(file);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", file.size);
    await this.trackDownload(req, ObjectType.Product, file.uuid);
    upstreamRes.pipe(res, { end: true });
  };

  raw: RequestHandler = async (req, res, next) => {
    const file = await this.uploadController.findAnyUpload((repo) =>
      repo.findOne({
        where: { uuid: req.params.uuid, filename: req.params.filename, status: Not(Status.CREATED) },
        relations: { site: true },
      }),
    );
    if (!file) return next({ status: 404, errors: ["File not found"] });
    const upstreamRes = await this.makeRawFileRequest(file);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", file.size);
    await this.trackDownload(req, ObjectType.Raw, file.uuid);
    upstreamRes.pipe(res, { end: true });
  };

  collection: RequestHandler = async (req, res, next) => {
    const collectionUuid: string = req.params.uuid;
    const collection = await this.collController.findCollection(collectionUuid);
    if (!collection) {
      return next({ status: 404, errors: ["No collection matches this UUID."] });
    }

    const allFiles = (collection.regularFiles as unknown as File[]).concat(collection.modelFiles);
    await this.trackDownload(req, ObjectType.Collection, collection.uuid);
    try {
      const archive = archiver("zip", { store: true });
      archive.on("warning", console.error);
      archive.on("error", console.error);
      req.on("close", () => archive.abort());

      const shortUuid = collection.uuid.toLowerCase().replace(/-/g, "").slice(0, 16);
      const receiverFilename = `cloudnet-collection-${shortUuid}.zip`;
      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="${receiverFilename}"`);
      archive.pipe(res);

      archive.append(await this.generateReadme(collection), { name: "README.md" });
      archive.append(LICENSE_TEXT, { name: "LICENSE.txt" });

      const appendFile = async (idx: number) => {
        const file = allFiles[idx];
        const fileStream = await this.makeFileRequest(file);
        archive.append(fileStream, { name: file.filename });
        if (idx == allFiles.length - 1) {
          await archive.finalize();
        }
      };
      let i = -2;
      archive.on("entry", (_entry) => {
        i++;
        if (i > 0 && i < allFiles.length) {
          appendFile(i);
        }
      });
      await appendFile(0);
    } catch (err) {
      res.sendStatus(500);
      next(err);
    }
  };

  image: RequestHandler = async (req, res) => {
    const s3key = (req.params.s3key as unknown as string[]).join("/");
    const upstreamRes = await this.makeRequest(getS3pathForImage(s3key));
    if (upstreamRes.statusCode != 200) {
      res.status(upstreamRes.statusCode || 500);
      res.setHeader("Content-Type", "text/plain");
    } else {
      res.setHeader("Content-Type", "image/png");
    }
    upstreamRes.pipe(res, { end: true });
  };

  private makeFileRequest(file: File): Promise<IncomingMessage> {
    return this.makeRequest(getS3pathForFile(file), file.version);
  }

  private makeRawFileRequest(file: Upload): Promise<IncomingMessage> {
    return this.makeRequest(getS3pathForUpload(file));
  }

  private async makeRequest(s3path: string, version?: string): Promise<IncomingMessage> {
    const headers = {
      Authorization: ssAuthString(),
    };

    if (version) {
      s3path = `${s3path}?version=${version}`;
    }

    const requestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: "GET",
    };

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, resolve);
      req.on("error", (err) => reject({ status: 500, errors: err }));
      req.end();
    });
  }

  private async trackDownload(req: Request, type: ObjectType, uuid: string) {
    if (!req.ip) return;
    const result = this.ipLookup.get(req.ip);
    const dl = new Download(type, uuid, req.ip, result?.country?.iso_code);
    await this.downloadRepo.save(dl);
  }

  private async generateReadme(collection: Collection): Promise<string> {
    let citationText = "";
    try {
      const citation = await this.citationService.getCollectionCitation(collection);
      citationText = citation2txt(citation);
    } catch (e) {
      citationText = "Failed to generate citation.";
    }
    const lines = [
      "# README",
      `These files were downloaded from Cloudnet data portal: <${
        collection.pid ? collection.pid : getCollectionLandingPage(collection)
      }>`,
      "## Citation",
      citationText,
      "## License",
      "Cloudnet data is licensed under a Creative Commons Attribution 4.0 international licence.",
      "You should have received a copy of the license along with this work. If not, see <http://creativecommons.org/licenses/by/4.0/>.",
    ];
    return lines.join("\n\n") + "\n";
  }
}
