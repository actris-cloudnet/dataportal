import { DataSource, Repository } from "typeorm";
import { RequestHandler, Request } from "express";

import { UserAccount } from "../entity/UserAccount";
import { Permission, PermissionType, permissionTypeFromString } from "../entity/Permission";
import {
  InstrumentLogPermission,
  InstrumentLogPermissionType,
  instrumentLogPermissionTypeFromString,
} from "../entity/InstrumentLogPermission";
import { InstrumentInfo } from "../entity/Instrument";
import { Site } from "../entity/Site";
import { randomString } from "../lib";
import { Model } from "../entity/Model";
import { NextFunction } from "express-serve-static-core";
import { Token } from "../entity/Token";

interface PermissionInterface {
  id?: number;
  permission: PermissionType;
  siteId: string | null;
  modelId: string | null;
}

interface InstrumentLogPermissionInterface {
  id?: number;
  permission: InstrumentLogPermissionType;
  instrumentInfoUuid: string | null;
}

interface UserAccountInterface {
  id?: number;
  username: string | null;
  fullName?: string | null;
  orcidId?: string | null;
  password?: string;
  passwordHash?: string;
  activationToken?: string;
  permissions: PermissionInterface[];
  instrumentLogPermissions: InstrumentLogPermissionInterface[];
}

function hasProperty(obj: object, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export class UserAccountRoutes {
  private userRepo: Repository<UserAccount>;
  private permissionRepo: Repository<Permission>;
  private instrumentLogPermissionRepo: Repository<InstrumentLogPermission>;
  private instrumentInfoRepo: Repository<InstrumentInfo>;
  private tokenRepo: Repository<Token>;
  private siteRepo: Repository<Site>;
  private modelRepo: Repository<Model>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserAccount);
    this.permissionRepo = dataSource.getRepository(Permission);
    this.instrumentLogPermissionRepo = dataSource.getRepository(InstrumentLogPermission);
    this.instrumentInfoRepo = dataSource.getRepository(InstrumentInfo);
    this.tokenRepo = dataSource.getRepository(Token);
    this.siteRepo = dataSource.getRepository(Site);
    this.modelRepo = dataSource.getRepository(Model);
  }

  userResponse = (user: UserAccount): UserAccountInterface => {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      orcidId: user.orcidId,
      activationToken: user.activationToken || undefined,
      permissions: user.permissions.map((p) => ({
        id: p.id,
        permission: p.permission,
        siteId: p.site ? p.site.id : null,
        modelId: p.model ? p.model.id : null,
      })),
      instrumentLogPermissions: (user.instrumentLogPermissions ?? []).map((p) => ({
        id: p.id,
        permission: p.permission,
        instrumentInfoUuid: p.instrumentInfo ? p.instrumentInfo.uuid : null,
      })),
    };
  };

  postUserAccount: RequestHandler = async (req, res) => {
    let user = await this.userRepo.findOne({
      where: { username: req.body.username },
      relations: { permissions: { site: true, model: true }, instrumentLogPermissions: { instrumentInfo: true } },
    });
    if (user) {
      res.json(this.userResponse(user));
      return;
    }

    user = new UserAccount();
    user.username = req.body.username;
    if (req.body.password) {
      user.setPassword(req.body.password);
    } else {
      user.activationToken = randomString(32);
    }
    user.permissions = await this.createPermissions(req.body.permissions);
    user.instrumentLogPermissions = await this.createInstrumentLogPermissions(req.body.instrumentLogPermissions ?? []);

    await this.userRepo.save(user);
    res.status(201);
    res.json(this.userResponse(user));
  };

  async createPermissions(permissions: any) {
    const result = [];
    for (const perm of permissions) {
      const permissionType = permissionTypeFromString(perm.permission);
      const qb = this.permissionRepo
        .createQueryBuilder("permission")
        .leftJoinAndSelect("permission.site", "site")
        .leftJoinAndSelect("permission.model", "model")
        .where("permission.permission = :permissionType", { permissionType: permissionType });
      if (perm.siteId === null) {
        qb.andWhere("permission.site IS NULL");
      } else {
        qb.andWhere("permission.site = :siteId", { siteId: perm.siteId });
      }
      if (perm.modelId === null) {
        qb.andWhere("permission.model IS NULL");
      } else {
        qb.andWhere("permission.model = :modelId", { modelId: perm.modelId });
      }
      let permission = await qb.getOne();
      if (!permission) {
        permission = await this.permissionRepo.save({
          permission: permissionType,
          site: { id: perm.siteId },
          model: { id: perm.modelId },
        });
      }
      result.push(permission);
    }
    return result;
  }

  async createInstrumentLogPermissions(permissions: any[]) {
    const result = [];
    for (const perm of permissions) {
      const permissionType = instrumentLogPermissionTypeFromString(perm.permission);
      const qb = this.instrumentLogPermissionRepo
        .createQueryBuilder("ilp")
        .leftJoinAndSelect("ilp.instrumentInfo", "instrumentInfo")
        .where("ilp.permission = :permissionType", { permissionType });
      if (perm.instrumentInfoUuid === null) {
        qb.andWhere("ilp.instrumentInfo IS NULL");
      } else {
        qb.andWhere("instrumentInfo.uuid = :uuid", { uuid: perm.instrumentInfoUuid });
      }
      let permission = await qb.getOne();
      if (!permission) {
        permission = await this.instrumentLogPermissionRepo.save({
          permission: permissionType,
          instrumentInfo: perm.instrumentInfoUuid ? { uuid: perm.instrumentInfoUuid } : null,
        });
      }
      result.push(permission);
    }
    // canWriteLogs implies canReadLogs, so remove redundant canReadLogs entries
    const writeScopes = new Set(
      result
        .filter((p) => p.permission === InstrumentLogPermissionType.canWriteLogs)
        .map((p) => (p.instrumentInfo ? p.instrumentInfo.uuid : null)),
    );
    const hasGlobalWrite = writeScopes.has(null);
    if (writeScopes.size > 0) {
      return result.filter((p) => {
        if (p.permission !== InstrumentLogPermissionType.canReadLogs) return true;
        if (hasGlobalWrite) return false;
        const uuid = p.instrumentInfo ? p.instrumentInfo.uuid : null;
        return !writeScopes.has(uuid);
      });
    }
    return result;
  }

  async usernameAvailable(username: string): Promise<boolean> {
    const usernameTaken = await this.userRepo.existsBy({ username });
    return !usernameTaken;
  }

  putUserAccount: RequestHandler = async (req, res, next) => {
    const user = await this.userRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: { permissions: { site: true }, instrumentLogPermissions: { instrumentInfo: true } },
    });
    if (!user) {
      return next({ status: 404, errors: "UserAccount not found" });
    }
    if (hasProperty(req.body, "username")) {
      if (user.username !== req.body.username) {
        if (await this.usernameAvailable(req.body.username)) {
          user.username = req.body.username;
        } else {
          return next({ status: 400, errors: "username is already taken" });
        }
      }
    }
    if (hasProperty(req.body, "password")) {
      user.setPassword(req.body.password);
    }
    if (hasProperty(req.body, "permissions")) {
      user.permissions = await this.createPermissions(req.body.permissions);
    }
    if (hasProperty(req.body, "instrumentLogPermissions")) {
      user.instrumentLogPermissions = await this.createInstrumentLogPermissions(req.body.instrumentLogPermissions);
    }
    await this.userRepo.save(user);
    res.json(this.userResponse(user));
  };

  getUserAccount: RequestHandler = async (req, res, next) => {
    const user = await this.userRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: { permissions: { site: true, model: true }, instrumentLogPermissions: { instrumentInfo: true } },
    });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    res.json(this.userResponse(user));
  };

  deleteUserAccount: RequestHandler = async (req, res, next) => {
    const userId = Number(req.params.id);
    await this.tokenRepo.delete({ userAccount: { id: userId } });
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    await this.userRepo.remove(user);
    res.sendStatus(200);
  };

  getAllUserAccounts: RequestHandler = async (req, res) => {
    const users = await this.userRepo.find({
      relations: { permissions: { site: true, model: true }, instrumentLogPermissions: { instrumentInfo: true } },
    });
    res.json(users.map((u) => this.userResponse(u)));
  };

  validatePost: RequestHandler = async (req, res, next) => {
    if (!hasProperty(req.body, "username")) {
      return next({ status: 401, errors: "Missing the username" });
    }
    this.validateUsername(req, next);
    if (hasProperty(req.body, "password")) {
      this.validatePassword(req, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    if (hasProperty(req.body, "instrumentLogPermissions")) {
      await this.validateInstrumentLogPermissions(req, next);
    }
    return next();
  };

  validatePut: RequestHandler = async (req, res, next) => {
    if (hasProperty(req.body, "username") && req.body.username !== null) {
      this.validateUsername(req, next);
    }
    if (hasProperty(req.body, "password")) {
      this.validatePassword(req, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    if (hasProperty(req.body, "instrumentLogPermissions")) {
      await this.validateInstrumentLogPermissions(req, next);
    }
    return next();
  };

  validateUsername(req: Request, next: NextFunction): void {
    if (typeof req.body.username !== "string") {
      next({ status: 401, errors: "username must be a string" });
    } else if (req.body.username.length === 0) {
      next({ status: 401, errors: "username must be nonempty" });
    }
  }

  validatePassword(req: Request, next: NextFunction): void {
    if (typeof req.body.password !== "string") {
      next({ status: 401, errors: "password must be a string" });
    } else if (req.body.password.length === 0) {
      next({ status: 401, errors: "password must be nonempty" });
    }
  }

  validatePermissions: RequestHandler = async (req, res, next) => {
    if (Array.isArray(req.body.permissions)) {
      await this.validatePermissionList(req, res, next);
    } else {
      return next({ status: 401, errors: "Give permissions as a list" });
    }
  };

  validatePermissionList: RequestHandler = async (req, res, next) => {
    for (const permission of req.body.permissions) {
      res.locals.permission = permission;
      await this.validatePermission(req, res, next);
    }
  };

  validatePermission: RequestHandler = async (req, res, next) => {
    const permission = res.locals.permission;
    if (!hasProperty(permission, "siteId")) {
      return next({ status: 401, errors: "Missing the siteId from permission" });
    }
    if (!hasProperty(permission, "modelId")) {
      return next({ status: 401, errors: "Missing the modelId from permission" });
    }
    if (!hasProperty(permission, "permission")) {
      return next({ status: 401, errors: "Missing the permission type from permission" });
    }
    if (permission.siteId !== null) {
      const site = await this.siteRepo.findOneBy({ id: permission.siteId });
      if (!site) {
        return next({ status: 422, errors: "Given siteId does not exist" });
      }
    }
    if (permission.modelId !== null) {
      const model = await this.modelRepo.findOneBy({ id: permission.modelId });
      if (!model) {
        return next({ status: 422, errors: "Given modelId does not exist" });
      }
    }
    if (permissionTypeFromString(permission.permission) === undefined) {
      return next({ status: 422, errors: "Unexpected permission type" });
    }
  };

  validateInstrumentLogPermissions = async (req: Request, next: NextFunction) => {
    if (!Array.isArray(req.body.instrumentLogPermissions)) {
      return next({ status: 401, errors: "Give instrumentLogPermissions as a list" });
    }
    for (const perm of req.body.instrumentLogPermissions) {
      if (!hasProperty(perm, "permission")) {
        return next({ status: 401, errors: "Missing the permission type from instrumentLogPermission" });
      }
      if (!hasProperty(perm, "instrumentInfoUuid")) {
        return next({ status: 401, errors: "Missing instrumentInfoUuid from instrumentLogPermission" });
      }
      if (instrumentLogPermissionTypeFromString(perm.permission) === undefined) {
        return next({ status: 422, errors: "Unexpected instrumentLogPermission type" });
      }
      if (perm.instrumentInfoUuid !== null) {
        const info = await this.instrumentInfoRepo.findOneBy({ uuid: perm.instrumentInfoUuid });
        if (!info) {
          return next({ status: 422, errors: "Given instrumentInfoUuid does not exist" });
        }
      }
    }
  };
}
