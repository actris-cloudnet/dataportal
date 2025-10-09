import { DataSource, Repository } from "typeorm";
import { RequestHandler, Response, Request } from "express";
import * as basicAuth from "basic-auth";
import { randomBytes } from "node:crypto";

import { UserAccount } from "../entity/UserAccount";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
import { Model } from "../entity/Model";
import env from "./env";
import { hashVerifier, Token } from "../entity/Token";

export class Authenticator {
  private userRepo: Repository<UserAccount>;
  private tokenRepo: Repository<Token>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserAccount);
    this.tokenRepo = dataSource.getRepository(Token);
  }

  async basicLogin(username: string, password: string) {
    const user = await this.userRepo.findOneByOrFail({ username });
    if (!user.comparePassword(password)) {
      throw new Error("Invalid password");
    }
    return user;
  }

  async cookieLogin(token: string) {
    const selector = Buffer.from(token.slice(0, 32), "hex");
    const verifier = Buffer.from(token.slice(32), "hex");
    const tokenObj = await this.tokenRepo.findOneOrFail({
      where: { selector }, // TODO: check expired
      relations: { userAccount: true },
    });
    if (!tokenObj.compareVerifier(verifier)) {
      throw new Error("Invalid verifier");
    }
    return tokenObj.userAccount;
  }

  async orcidLogin(params: Record<string, any>) {
    console.log("ORCID:", params);
    const orcidId = params.orcid;
    const fullName = params.name;
    if (!orcidId) {
      throw new Error("Failed to get ORCID iD");
    }
    let user = await this.userRepo.findOneBy({ orcidId });
    if (user) {
      console.log("Existing user found");
      user.fullName = fullName;
      await this.userRepo.save(user);
    } else {
      console.log("Create new user");
      user = await this.userRepo.save({ orcidId, fullName });
    }
    return user;
  }

  userInfo: RequestHandler = async (req, res, next) => {
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const user = await this.userRepo.findOne({
      where: { id: req.user.id },
      relations: { permissions: true },
    });
    res.send(user);
  };

  logOut: RequestHandler = async (req, res) => {
    const token = req.cookies.token;
    const selector = Buffer.from(token.slice(0, 32), "hex");
    await this.tokenRepo.delete({ selector });
    res.clearCookie("token", { path: "/api" }).end();
  };

  orcidCallback: RequestHandler = async (req, res) => {
    console.log("USER", req.user);
    const selector = randomBytes(16);
    const verifier = randomBytes(16);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.tokenRepo.insert({
      selector,
      verifierHash: hashVerifier(verifier),
      userAccount: req.user,
      expiresAt,
    });
    const token = selector.toString("hex") + verifier.toString("hex");
    console.log("TOKEN", token);
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/api",
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
      })
      .redirect(env.DP_FRONTEND_URL);
  };

  async checkPermission(req: Request, permission: PermissionType, options: { site?: Site; model?: Model }) {
    if (!req.user) {
      throw { status: 401, errors: "Unauthorized" };
    }
    const qb = this.userRepo
      .createQueryBuilder("user_account")
      .leftJoinAndSelect("user_account.permissions", "permission")
      .leftJoinAndSelect("permission.site", "site")
      .where("user_account.id = :userId", { userId: req.user.id })
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
      if (!req.user) {
        return next({ status: 401, errors: "Unauthorized" });
      }
      const qb = this.userAccountRepository
        .createQueryBuilder("user_account")
        .leftJoinAndSelect("user_account.permissions", "permission")
        .leftJoinAndSelect("permission.site", "site")
        .where("user_account.id = :userId", { userId: req.user.id })
        .andWhere("permission.permission = :permission", { permission });
      const hasPermission = await qb.getExists();
      if (!hasPermission) {
        return next({ status: 401, errors: "Missing permission" });
      }
      return next();
    };
  };
}
