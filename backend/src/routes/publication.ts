import { Request, RequestHandler, Response } from "express";
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

  postPublication: RequestHandler = async (req: Request, res: Response, next) => {
    const uri: any = req.query.uri;
    if (!uri) next({ status: 400, error: "uri query parameter is missing" });
    try {
      const pub = new Publication();
      pub.pid = uri;
      pub.year = (await this.fetchCitation(uri, "application/json")).data.year;
      pub.citation = (await this.fetchCitation(uri, "text/html")).data;
      await this.publicationRepo.save(pub);
      res.sendStatus(200);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  getPublications: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const publications = await this.publicationRepo.find({ order: { year: "DESC" } });
      res.send(publications);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
