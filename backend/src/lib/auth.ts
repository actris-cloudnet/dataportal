import { Connection, Repository } from "typeorm";
import { RequestHandler } from "express";
import { UserAccount } from "../entity/UserAccount";
import { InstrumentUpload, ModelUpload } from "../entity/Upload";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
const auth = require("basic-auth");

export class Authenticator {
  private userAccountRepository: Repository<UserAccount>;

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>("user_account");
  }

  middleware: RequestHandler = async (req, res, next) => {
    // Check that request has credentials included
    let credentials = auth(req);
    if (!credentials) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    let userAccount = await this.userAccountRepository.findOne({ username: credentials.name });
    // Check that user exists in the database
    if (!userAccount) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    // Check that password in the request is correct
    if (userAccount.comparePassword(credentials.pass)) {
      res.locals.username = userAccount.username;
      res.locals.authenticated = true;
      next();
      return;
    } else {
      return next({ status: 401, errors: "Unauthorized" });
    }
  };
}

interface authorizeSiteMiddlewareParams {
  permission: PermissionType;
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>;
  private siteRepository: Repository<Site>;
  private instrumentUploadRepository: Repository<InstrumentUpload>;
  private modelUploadRepository: Repository<ModelUpload>;

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>("user_account");
    this.siteRepository = conn.getRepository<Site>("site");
    this.instrumentUploadRepository = conn.getRepository<InstrumentUpload>("instrument_upload");
    this.modelUploadRepository = conn.getRepository<ModelUpload>("model_upload");
  }

  metadataMiddleware: RequestHandler = async (req, res, next) => {
    let site: Site;
    if (!Object.prototype.hasOwnProperty.call(req, "body") || !Object.prototype.hasOwnProperty.call(req.body, "site")) {
      // The legacy upload takes siteId from the username
      const siteCandidate: Site | undefined = await this.siteRepository.findOne(res.locals.username);
      if (siteCandidate === undefined) {
        return next({ status: 400, errors: "Add site to the request body" });
      }
      site = siteCandidate!;
    } else {
      const siteCandidate: Site | undefined = await this.siteRepository.findOne(req.body.site);
      if (siteCandidate === undefined) {
        return next({ status: 422, errors: "Site does not exist" });
      }
      site = siteCandidate!;
    }
    res.locals.site = site;
    next();
    return;
  };
  instrumentDataUploadMiddleware: RequestHandler = async (req, res, next) => {
    const uploadCandidate: InstrumentUpload | undefined = await this.instrumentUploadRepository.findOne(
      { checksum: req.params.checksum },
      { relations: ["site"] }
    );
    if (uploadCandidate === undefined) {
      return next({ status: 422, errors: "Checksum does not exist in the database" });
    }
    const site: Site = uploadCandidate!.site;
    res.locals.site = site;
    next();
    return;
  };
  modelDataUploadMiddleware: RequestHandler = async (req, res, next) => {
    const modelUploadCandidate: ModelUpload | undefined = await this.modelUploadRepository.findOne(
      { checksum: req.params.checksum },
      { relations: ["site"] }
    );
    if (modelUploadCandidate === undefined) {
      return next({ status: 422, errors: "Checksum does not exist in the database" });
    }
    const site: Site = modelUploadCandidate!.site;
    res.locals.site = site;
    next();
    return;
  };

  authorizeSiteMiddleware = ({ permission }: authorizeSiteMiddlewareParams): RequestHandler => {
    return async (req, res, next) => {
      if (!res.locals.authenticated || !res.locals.username) {
        console.error("Authorizator received unauthenticated request");
        return next({ status: 500, errors: "Oops" });
      }
      if (!res.locals.site) {
        console.error("Authorizator received request without site");
        return next({ status: 500, errors: "Oops" });
      }
      const userQuery = this.userAccountRepository
        .createQueryBuilder("user_account")
        .leftJoinAndSelect("user_account.permissions", "permission")
        .leftJoinAndSelect("permission.site", "site")
        .where("user_account.username = :username")
        .andWhere("(site IS NULL OR site.id = :siteId)") // parentheses!
        .andWhere("permission.permission = :permission")
        .setParameters({ username: res.locals.username, siteId: res.locals.site.id, permission: permission });
      const userWithProperPermission = await userQuery.getOne();
      if (userWithProperPermission === undefined) {
        return next({ status: 401, errors: "Missing permission" });
      }
      req.params.site = res.locals.site.id;
      return next();
    };
  };
}
