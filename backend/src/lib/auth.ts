import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";
import { UserAccount } from "../entity/UserAccount";
import { InstrumentUpload, ModelUpload } from "../entity/Upload";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
import basicAuth = require("basic-auth");

export class Authenticator {
  private userAccountRepository: Repository<UserAccount>;

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
  }

  verifyCredentials(): RequestHandler {
    return async (req, res, next) => {
      const credentials = basicAuth(req);
      if (!credentials) {
        return next({ status: 401, errors: "Unauthorized" });
      }
      const userAccount = await this.userAccountRepository.findOneBy({ username: credentials.name });
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
    };
  }
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>;
  private siteRepository: Repository<Site>;
  readonly instrumentUploadRepository: Repository<InstrumentUpload>;
  readonly modelUploadRepository: Repository<ModelUpload>;

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
    this.siteRepository = dataSource.getRepository(Site);
    this.instrumentUploadRepository = dataSource.getRepository(InstrumentUpload);
    this.modelUploadRepository = dataSource.getRepository(ModelUpload);
  }

  verifySite: RequestHandler = async (req, res, next) => {
    const siteName = "body" in req && "site" in req.body ? req.body.site : res.locals.username;
    const site = await this.siteRepository.findOneBy({ id: siteName });
    if (!site) {
      return next({ status: 422, errors: "Site does not exist" });
    }
    res.locals.site = site;
    return next();
  };

  findSiteFromChecksum: RequestHandler = async (req, res, next) => {
    const repos = [this.instrumentUploadRepository, this.modelUploadRepository];
    for (const repo of repos) {
      const uploadMetadata = await repo.findOne({
        where: { checksum: req.params.checksum },
        relations: { site: true },
      });
      if (uploadMetadata) {
        res.locals.site = uploadMetadata.site;
        return next();
      }
    }
    return next({ status: 422, errors: "Checksum does not exist in the database" });
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
      const userWithProperPermission = await userQuery.getOne();
      if (!userWithProperPermission) {
        return next({ status: 401, errors: "Missing permission" });
      }
      if (isSite) {
        req.params.site = res.locals.site.id;
      }
      return next();
    };
  };
}
