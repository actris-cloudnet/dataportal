import { Connection, Repository } from "typeorm";
import { RequestHandler } from "express";
import { UserAccount } from "../entity/UserAccount";
import { Upload } from "../entity/Upload";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
const auth = require("basic-auth");

export class Authenticator {
  private userAccountRepository: Repository<UserAccount>;

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>("user_account");
  }

  verifyCredentials(realm: string | null = null): RequestHandler {
    return async (req, res, next) => {
      const credentials = auth(req);
      if (!credentials) {
        if (realm) res.set("WWW-Authenticate", `Basic realm="${realm}"`);
        return next({ status: 401, errors: "Unauthorized" });
      }
      try {
        const userAccount = await this.userAccountRepository.findOne({ username: credentials.name });
        if (!userAccount) {
          return next({ status: 401, errors: "Unauthorized" });
        }
        if (userAccount.comparePassword(credentials.pass)) {
          res.locals.username = userAccount.username;
          res.locals.authenticated = true;
          return next();
        } else {
          return next({ status: 401, errors: "Unauthorized" });
        }
      } catch (err) {
        next({ status: 500, errors: `Internal server error: ${err}` });
      }
    };
  }
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>;
  private siteRepository: Repository<Site>;
  readonly instrumentUploadRepository: Repository<Upload>;
  readonly miscUploadRepository: Repository<Upload>;
  readonly modelUploadRepository: Repository<Upload>;

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>("user_account");
    this.siteRepository = conn.getRepository<Site>("site");
    this.instrumentUploadRepository = conn.getRepository<Upload>("instrument_upload");
    this.miscUploadRepository = conn.getRepository<Upload>("misc_upload");
    this.modelUploadRepository = conn.getRepository<Upload>("model_upload");
  }

  verifySite: RequestHandler = async (req, res, next) => {
    try {
      const siteName = "body" in req && "site" in req.body ? req.body.site : res.locals.username;
      const site = await this.siteRepository.findOne(siteName);
      if (site === undefined) {
        return next({ status: 422, errors: "Site does not exist" });
      }
      res.locals.site = site;
      return next();
    } catch (err) {
      return next({ status: 500, errors: `Internal server error: ${err}` });
    }
  };

  findSiteFromChecksum: RequestHandler = async (req, res, next) => {
    let uploadMetadata: Upload | undefined;
    const repos = [this.instrumentUploadRepository, this.miscUploadRepository, this.modelUploadRepository];
    try {
      for (const repo of repos) {
        uploadMetadata = await repo.findOne({ checksum: req.params.checksum }, { relations: ["site"] });
        if (uploadMetadata) break;
      }
      if (uploadMetadata === undefined) {
        return next({ status: 422, errors: "Checksum does not exist in the database" });
      }
      res.locals.site = uploadMetadata.site;
      return next();
    } catch (err) {
      return next({ status: 500, errors: `Internal server error: ${err}` });
    }
  };

  verifyPermission = (permission: PermissionType): RequestHandler => {
    return async (req, res, next) => {
      if (!res.locals.authenticated || !res.locals.username) {
        return next({ status: 500, errors: "Authorizator received unauthenticated request" });
      }
      const isSite = "site" in res.locals;
      const params: any = {
        username: res.locals.username,
        permission: permission,
      };
      if (isSite) {
        params.siteId = res.locals.site.id;
      }
      let userQuery = this.userAccountRepository
        .createQueryBuilder("user_account")
        .leftJoinAndSelect("user_account.permissions", "permission")
        .leftJoinAndSelect("permission.site", "site")
        .where("user_account.username = :username");
      if (isSite) {
        userQuery = userQuery.andWhere("(site IS NULL OR site.id = :siteId)");
      }
      userQuery = userQuery.andWhere("permission.permission = :permission").setParameters(params);
      try {
        const userWithProperPermission = await userQuery.getOne();
        if (userWithProperPermission === undefined) {
          return next({ status: 401, errors: "Missing permission" });
        }
        if (isSite) {
          req.params.site = res.locals.site.id;
        }
        return next();
      } catch (err) {
        return next({ status: 500, errors: `Internal server error: ${err}` });
      }
    };
  };
}
