import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { Publication } from "../entity/Publication";
import axios, { AxiosResponse } from "axios";
import env from "../lib/env";

export class PublicationRoutes {
  constructor(dataSource: DataSource) {
    this.publicationRepo = dataSource.getRepository(Publication);
  }

  readonly publicationRepo: Repository<Publication>;

  private fetchCitation(uri: string, accept: string): Promise<AxiosResponse<any>> {
    return axios.get(env.CITATION_SERVICE_URL, {
      headers: { accept },
      params: { uri },
    });
  }

  postPublication: RequestHandler = async (req, res, next) => {
    const uri = req.body.uri;
    if (typeof uri !== "string") {
      return next({ status: 400, error: "uri is missing or invalid" });
    }
    const citationHtml = (await this.fetchCitation(uri, "text/html")).data;
    const citationJson = (await this.fetchCitation(uri, "application/json")).data;
    const year = citationJson.published[0];
    const month = citationJson.published[1] || 1;
    const day = citationJson.published[2] || 1;
    const pub = new Publication();
    pub.pid = citationJson.url;
    pub.publishedAt = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    pub.citation = citationHtml;
    await this.publicationRepo.save(pub);
    res.sendStatus(200);
  };

  deletePublication: RequestHandler = async (req, res, next) => {
    const uri = req.query.uri;
    if (typeof uri !== "string") {
      return next({ status: 400, error: "uri is missing or invalid" });
    }
    await this.publicationRepo.delete({ pid: uri });
    res.sendStatus(200);
  };

  getPublications: RequestHandler = async (req, res, next) => {
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
    if (typeof limit !== "undefined" && (!Number.isFinite(limit) || limit <= 0)) {
      return next({ status: 400, error: "limit is invalid" });
    }

    const publications = await this.publicationRepo.find({
      order: { publishedAt: "DESC", citation: "ASC" },
      take: limit,
    });
    res.send(publications.map(this.mapPublication));
  };

  private mapPublication(publication: Publication) {
    return {
      pid: publication.pid,
      citation: publication.citation,
      publishedAt: publication.publishedAt,
      updatedAt: publication.updatedAt.toISOString(),
    };
  }
}
