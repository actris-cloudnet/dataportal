import { DataSource, Repository } from "typeorm";
import { RequestHandler } from "express";
import basicAuth = require("basic-auth");

import { UserAccount } from "../entity/UserAccount";
import { Permission, PermissionType, permissionTypeFromString } from "../entity/Permission";
import { Site } from "../entity/Site";
import { randomString } from "../lib";
import { Model } from "../entity/Model";

interface PermissionInterface {
  id?: number;
  permission: PermissionType;
  siteId: string | null;
  modelId: string | null;
}

interface UserAccountInterface {
  id?: number;
  username: string;
  password?: string;
  passwordHash?: string;
  activationToken?: string;
  permissions: PermissionInterface[];
}

function hasProperty(obj: object, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export class UserAccountRoutes {
  private userAccountRepository: Repository<UserAccount>;
  private permissionRepository: Repository<Permission>;
  private siteRepository: Repository<Site>;
  private modelRepository: Repository<Model>;

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
    this.permissionRepository = dataSource.getRepository(Permission);
    this.siteRepository = dataSource.getRepository(Site);
    this.modelRepository = dataSource.getRepository(Model);
  }

  userResponse = (user: UserAccount): UserAccountInterface => {
    return {
      id: user.id,
      username: user.username,
      activationToken: user.activationToken || undefined,
      permissions: user.permissions.map((p) => ({
        id: p.id,
        permission: p.permission,
        siteId: p.site ? p.site.id : null,
        modelId: p.model ? p.model.id : null,
      })),
    };
  };

  postUserAccount: RequestHandler = async (req, res) => {
    let user = await this.userAccountRepository.findOne({
      where: { username: req.body.username },
      relations: { permissions: { site: true, model: true } },
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

    await this.userAccountRepository.save(user);
    res.status(201);
    res.json(this.userResponse(user));
  };

  async createPermissions(permissions: any) {
    const result = [];
    for (const perm of permissions) {
      const permissionType = permissionTypeFromString(perm.permission);
      const qb = this.permissionRepository
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
        permission = await this.permissionRepository.save({
          permission: permissionType,
          site: { id: perm.siteId },
          model: { id: perm.modelId },
        });
      }
      result.push(permission);
    }
    return result;
  }

  async usernameAvailable(username: string): Promise<boolean> {
    const usernameTaken = await this.userAccountRepository.existsBy({ username });
    return !usernameTaken;
  }

  putUserAccount: RequestHandler = async (req, res, next) => {
    const user = await this.userAccountRepository.findOne({
      where: { id: Number(req.params.id) },
      relations: { permissions: { site: true } },
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
    await this.userAccountRepository.save(user);
    res.json(this.userResponse(user));
  };

  getUserAccount: RequestHandler = async (req, res, next) => {
    const user = await this.userAccountRepository.findOne({
      where: { id: Number(req.params.id) },
      relations: { permissions: { site: true, model: true } },
    });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    res.json(this.userResponse(user));
  };

  deleteUserAccount: RequestHandler = async (req, res, next) => {
    const user = await this.userAccountRepository.findOneBy({ id: Number(req.params.id) });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    await this.userAccountRepository.remove(user);
    res.sendStatus(200);
  };

  getAllUserAccounts: RequestHandler = async (req, res) => {
    const users = await this.userAccountRepository.find({ relations: { permissions: { site: true, model: true } } });
    res.json(users.map((u) => this.userResponse(u)));
  };

  validatePost: RequestHandler = async (req, res, next) => {
    if (!hasProperty(req.body, "username")) {
      return next({ status: 401, errors: "Missing the username" });
    }
    this.validateUsername(req, res, next);
    if (hasProperty(req.body, "password")) {
      this.validatePassword(req, res, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    return next();
  };

  validatePut: RequestHandler = async (req, res, next) => {
    if (hasProperty(req.body, "username")) {
      this.validateUsername(req, res, next);
    }
    if (hasProperty(req.body, "password")) {
      this.validatePassword(req, res, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    return next();
  };

  validateUsername: RequestHandler = (req, res, next) => {
    if (typeof req.body.username !== "string") {
      return next({ status: 401, errors: "username must be a string" });
    } else if (req.body.username.length === 0) {
      return next({ status: 401, errors: "username must be nonempty" });
    }
  };

  validatePassword: RequestHandler = (req, res, next) => {
    if (typeof req.body.password !== "string") {
      return next({ status: 401, errors: "password must be a string" });
    } else if (req.body.password.length === 0) {
      return next({ status: 401, errors: "password must be nonempty" });
    }
  };

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
      const site = await this.siteRepository.findOneBy({ id: permission.siteId });
      if (!site) {
        return next({ status: 422, errors: "Given siteId does not exist" });
      }
    }
    if (permission.modelId !== null) {
      const model = await this.modelRepository.findOneBy({ id: permission.modelId });
      if (!model) {
        return next({ status: 422, errors: "Given modelId does not exist" });
      }
    }
    if (permissionTypeFromString(permission.permission) === undefined) {
      return next({ status: 422, errors: "Unexpected permission type" });
    }
  };

  userInfo: RequestHandler = async (req, res, next) => {
    const credentials = basicAuth(req);
    if (!credentials) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    const user = await this.userAccountRepository.findOne({
      where: { username: credentials.name },
      relations: { permissions: { site: true } },
    });
    if (!user) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    if (!user.comparePassword(credentials.pass)) {
      return next({ status: 401, errors: "Unauthorized" });
    }
    res.send(user.permissions);
  };
}
