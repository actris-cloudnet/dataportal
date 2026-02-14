import { DataSource, IsNull, MoreThan, Not, Repository } from "typeorm";
import { RequestHandler, Response, Request } from "express";
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
    const user = await this.userRepo.findOneBy({ username, passwordHash: Not(IsNull()) });
    if (!user || !user.comparePassword(password)) {
      return false;
    }
    return user;
  }

  async cookieLogin(token: string) {
    const now = new Date();
    const selector = Buffer.from(token.slice(0, 32), "hex");
    const verifier = Buffer.from(token.slice(32), "hex");
    const tokenObj = await this.tokenRepo.findOne({
      where: { selector, expiresAt: MoreThan(now) },
      relations: { userAccount: true },
    });
    if (!tokenObj || !tokenObj.compareVerifier(verifier)) {
      return false;
    }
    return tokenObj.userAccount;
  }

  async orcidLogin(params: Record<string, any>) {
    const orcidId = params.orcid;
    const fullName = params.name;
    if (!orcidId) {
      throw new Error("Failed to get ORCID iD");
    }
    const user = await this.userRepo.findOneBy({ orcidId });
    if (user) {
      user.fullName = fullName;
      await this.userRepo.save(user);
    } else {
      // Allow only existing users for now.
      // user = await this.userRepo.save({ orcidId, fullName });
      return false;
    }
    return user;
  }

  logIn: RequestHandler = async (req, res, next) => {
    if (typeof req.body.username !== "string") {
      return next({ status: 400, errors: "Invalid username" });
    }
    if (typeof req.body.password !== "string") {
      return next({ status: 400, errors: "Invalid password" });
    }
    const user = await this.userRepo.findOne({
      where: { username: req.body.username, passwordHash: Not(IsNull()) },
      relations: { permissions: true, instrumentLogPermissions: { instrumentInfo: true } },
    });
    if (!user || !(await this.hasPermission(user, PermissionType.canLogin))) {
      return next({ status: 401, errors: "Invalid username" });
    }
    if (!user.comparePassword(req.body.password)) {
      return next({ status: 401, errors: "Invalid password" });
    }
    await this.createToken(res, user);
    res.send(this.serializeUser(user));
  };

  userInfo: RequestHandler = async (req, res, next) => {
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const user = await this.userRepo.findOneOrFail({
      where: { id: req.user.id },
      relations: { permissions: true, instrumentLogPermissions: { instrumentInfo: true } },
    });
    res.send(this.serializeUser(user));
  };

  private serializeUser = (user: UserAccount) => ({
    ...user,
    passwordHash: undefined,
    activationToken: undefined,
    instrumentLogPermissions: (user.instrumentLogPermissions ?? []).map((p) => ({
      id: p.id,
      permission: p.permission,
      instrumentInfoUuid: p.instrumentInfo ? p.instrumentInfo.uuid : null,
    })),
  });

  logOut: RequestHandler = async (req, res) => {
    const token = req.cookies.token;
    const selector = Buffer.from(token.slice(0, 32), "hex");
    await this.tokenRepo.delete({ selector });
    res.clearCookie("token", { path: "/api" }).end();
  };

  nextCookie: RequestHandler = async (req, res, next) => {
    if (req.query.next) {
      res.cookie("next", req.query.next, {
        httpOnly: true,
        path: "/api",
        secure: process.env.NODE_ENV === "production",
      });
    }
    next();
  };

  orcidCallback: RequestHandler = async (req, res) => {
    await this.createToken(res, req.user!);
    let url = env.DP_FRONTEND_URL;
    if (req.cookies.next) {
      url += req.cookies.next;
      res.clearCookie("next", { path: "/api" });
    }
    res.redirect(url);
  };

  private async createToken(res: Response, user: UserAccount) {
    const selector = randomBytes(16);
    const verifier = randomBytes(16);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await this.tokenRepo.insert({
      selector,
      verifierHash: hashVerifier(verifier),
      userAccount: user,
      expiresAt,
    });
    const token = selector.toString("hex") + verifier.toString("hex");
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/api",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
    });
  }

  async checkPermission(req: Request, permission: PermissionType, options: { site?: Site; model?: Model }) {
    if (!req.user) {
      throw { status: 401, errors: "Unauthorized" };
    }
    if (!(await this.hasPermission(req.user, permission, options))) {
      throw { status: 401, errors: "Missing permission" };
    }
  }

  async hasPermission(user: UserAccount, permission: PermissionType, options?: { site?: Site; model?: Model }) {
    const qb = this.userRepo
      .createQueryBuilder("user_account")
      .leftJoinAndSelect("user_account.permissions", "permission")
      .leftJoinAndSelect("permission.site", "site")
      .where("user_account.id = :userId", { userId: user.id })
      .andWhere("permission.permission = :permission", { permission });
    if (options && options.site) {
      qb.andWhere("(site IS NULL OR site.id = :siteId)", { siteId: options.site.id });
    }
    if (options && options.model) {
      qb.andWhere(`(permission."modelId" IS NULL OR permission."modelId" = :modelId)`, { modelId: options.model.id });
    }
    return await qb.getExists();
  }
}

export class Authorizator {
  private userRepo: Repository<UserAccount>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserAccount);
  }

  verifyPermission = (permission: PermissionType): RequestHandler => {
    return async (req, res, next) => {
      if (!req.user) {
        return next({ status: 401, errors: "Unauthorized" });
      }
      const qb = this.userRepo
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
