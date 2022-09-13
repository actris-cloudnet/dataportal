import { Request, RequestHandler, Response } from "express";
import { Connection, Repository } from "typeorm";
import { Publication } from "../entity/Publication";
import axios from "axios";
import env from "../lib/env";

export class PublicationRoutes {
  constructor(conn: Connection) {
    this.publicationRepo = conn.getRepository<Publication>("publication");
  }

  readonly publicationRepo: Repository<Publication>;

  postPublication: RequestHandler = async (req: Request, res: Response, next) => {
    const uri: any = req.query.uri;
    if (!uri) next({ status: 400, error: "uri query parameter is missing" });
    try {
      const pub = new Publication();
      pub.pid = uri;
      let config: any = {
        headers: { accept: "application/json" },
        params: { uri: uri },
      };
      const citation_service_url = env.CITATION_SERVICE_URL;
      pub.year = (await axios.get(citation_service_url, config)).data.year;
      config.headers.accept = "text/html";
      pub.citation = (await axios.get(citation_service_url, config)).data;
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
