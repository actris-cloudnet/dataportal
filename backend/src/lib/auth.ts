import { DataSource, Repository } from "typeorm";
import { RequestHandler, Response } from "express";
import * as basicAuth from "basic-auth";

import { UserAccount } from "../entity/UserAccount";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
import { Model } from "../entity/Model";

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

  async checkPermission(res: Response, permission: PermissionType, options: { site?: Site; model?: Model }) {
    const qb = this.userAccountRepository
      .createQueryBuilder("user_account")
      .leftJoinAndSelect("user_account.permissions", "permission")
      .leftJoinAndSelect("permission.site", "site")
      .where("user_account.username = :username", { username: res.locals.username })
      .andWhere("permission.permission = :permission", { permission });
    if (options.site) {
      qb.andWhere("(site IS NULL OR site.id = :siteId)", { siteId: options.site.id });
    }
    if (options.model) {
      qb.andWhere(`(permission."modelId" IS NULL OR permission."modelId" = :modelId)`, { modelId: options.model.id });
    }
    const hasPermission = await qb.getExists();
    if (!hasPermission) {
      throw { status: 401, errors: "Missing permission" };
    }
  }
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>;

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
  }

  verifyPermission = (permission: PermissionType): RequestHandler => {
    return async (req, res, next) => {
      if (!res.locals.authenticated || !res.locals.username) {
        return next({ status: 500, errors: "Authorizator received unauthenticated request" });
      }
      const qb = this.userAccountRepository
        .createQueryBuilder("user_account")
        .leftJoinAndSelect("user_account.permissions", "permission")
        .leftJoinAndSelect("permission.site", "site")
        .where("user_account.username = :username", { username: res.locals.username })
        .andWhere("permission.permission = :permission", { permission });
      const hasPermission = await qb.getExists();
      if (!hasPermission) {
        return next({ status: 401, errors: "Missing permission" });
      }
      return next();
    };
  };
}
