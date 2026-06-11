import { DataSource, IsNull, MoreThan, Not, Repository } from "typeorm";
import { RequestHandler, Response, Request } from "express";
import { randomBytes } from "node:crypto";

import { UserAccount } from "../entity/UserAccount";
import { PermissionType } from "../entity/Permission";
import { Site } from "../entity/Site";
import { Model } from "../entity/Model";
import { Person } from "../entity/Person";
import env from "./env";
import { hashVerifier, Token } from "../entity/Token";
import { InstrumentInfo } from "../entity/Instrument";
import { InstrumentLogPermissionType } from "../entity/InstrumentLogPermission";

const API_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TOKEN_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

export class Authenticator {
  private userRepo: Repository<UserAccount>;
  private tokenRepo: Repository<Token>;
  private personRepo: Repository<Person>;
  private instrumentInfoRepo: Repository<InstrumentInfo>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserAccount);
    this.tokenRepo = dataSource.getRepository(Token);
    this.personRepo = dataSource.getRepository(Person);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
  }

  async basicLogin(username: string, password: string) {
    const user = await this.userRepo.findOneBy({ username, passwordHash: Not(IsNull()) });
    if (!user || !user.comparePassword(password)) {
      return false;
    }
    return user;
  }

  async tokenLogin(token: string) {
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
    const orcid = params.orcid;
    if (!orcid) {
      throw new Error("Failed to get ORCID iD");
    }

    // Allow existing user.
    const user = await this.userRepo.findOneBy({ person: { orcid } });
    if (user) {
      return user;
    }

    // Create user for active instrument contact.
    const person = await this.personRepo
      .createQueryBuilder("person")
      .innerJoin("person.instrumentContacts", "contact")
      .where("person.orcid = :orcid", { orcid })
      .andWhere('CURRENT_DATE <@ daterange(contact."startDate", contact."endDate", \'[]\')')
      .getOne();
    if (!person) {
      return false;
    }
    const newUser = await this.userRepo.save({ person });
    return newUser;
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
    await this.createSessionToken(res, user);
    const uuids = await this.getInstrumentUuids(user);
    res.send(this.serializeUser(user, uuids));
  };

  userInfo: RequestHandler = async (req, res, next) => {
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const user = await this.userRepo.findOneOrFail({
      where: { id: req.user.id },
      relations: { person: true, permissions: true, instrumentLogPermissions: { instrumentInfo: true } },
    });
    const uuids = await this.getInstrumentUuids(user);
    res.send(this.serializeUser(user, uuids));
  };

  private async getInstrumentUuids(user: UserAccount) {
    if (!user.person) return [];
    const instrumentInfos = await this.instrumentInfoRepo
      .createQueryBuilder("instrumentInfo")
      .select("instrumentInfo.uuid")
      .innerJoin("instrumentInfo.contacts", "contact")
      .where("contact.personId = :personId", { personId: user.person.id })
      .andWhere('CURRENT_DATE <@ daterange(contact."startDate", contact."endDate", \'[]\')')
      .getMany();
    return instrumentInfos.map((instrument) => instrument.uuid);
  }

  private serializeUser = (user: UserAccount, instrumentInfoUuids: string[]) => ({
    ...user,
    passwordHash: undefined,
    activationToken: undefined,
    instrumentLogPermissions: (user.instrumentLogPermissions ?? [])
      .map((p) => ({
        permission: p.permission,
        instrumentInfoUuid: p.instrumentInfo ? p.instrumentInfo.uuid : null,
      }))
      .concat(
        instrumentInfoUuids.map((instrumentUuid) => ({
          permission: InstrumentLogPermissionType.canWriteLogs,
          instrumentInfoUuid: instrumentUuid,
        })),
      ),
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
    await this.createSessionToken(res, req.user!);
    let url = env.DP_FRONTEND_URL;
    if (req.cookies.next) {
      url += req.cookies.next;
      res.clearCookie("next", { path: "/api" });
    }
    res.redirect(url);
  };

  generateToken: RequestHandler = async (req, res, next) => {
    if (!req.user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const expiresAt = new Date(Date.now() + API_TOKEN_LIFETIME_MS);
    const { token } = await this.insertToken(req.user, expiresAt);
    res.json({ token, expiresAt: expiresAt.toISOString() });
  };

  private async insertToken(user: UserAccount, expiresAt: Date) {
    const selector = randomBytes(16);
    const verifier = randomBytes(16);
    await this.tokenRepo.insert({
      selector,
      verifierHash: hashVerifier(verifier),
      userAccount: user,
      expiresAt,
    });
    const token = selector.toString("hex") + verifier.toString("hex");
    return { token, expiresAt };
  }

  private async createSessionToken(res: Response, user: UserAccount) {
    const expiresAt = new Date(Date.now() + SESSION_TOKEN_LIFETIME_MS);
    const { token } = await this.insertToken(user, expiresAt);
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
