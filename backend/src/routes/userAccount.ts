import { DataSource, Repository } from "typeorm";
import { NextFunction, Request, RequestHandler, Response } from "express";
import basicAuth = require("basic-auth");

import { UserAccount } from "../entity/UserAccount";
import { Permission, PermissionType, permissionTypeFromString } from "../entity/Permission";
import { Site } from "../entity/Site";
import { randomString } from "../lib";

interface PermissionInterface {
  id?: number;
  permission: PermissionType;
  siteId: string | null;
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

  constructor(dataSource: DataSource) {
    this.userAccountRepository = dataSource.getRepository(UserAccount);
    this.permissionRepository = dataSource.getRepository(Permission);
    this.siteRepository = dataSource.getRepository(Site);
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
      })),
    };
  };
  postUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    let user = await this.userAccountRepository.findOne({
      where: { username: req.body.username },
      relations: { permissions: { site: true } },
    });
    if (user) {
      res.status(200);
      res.json(this.userResponse(user));
      return;
    }
    await this.createPermissions(req, res, next);

    user = new UserAccount();
    user.username = req.body.username;
    if (req.body.password) {
      user.setPassword(req.body.password);
    } else {
      user.activationToken = randomString(32);
    }
    user.permissions = res.locals.permissions;

    await this.userAccountRepository.save(user);
    res.status(201);
    res.json(this.userResponse(user));
  };

  async createPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    const permissions: Permission[] = [];
    for (const perm of req.body.permissions) {
      let permission: Permission;
      const permissionType = permissionTypeFromString(perm.permission);
      let permissionCandidate: Permission | null;
      let site: Site | null = null;
      if (perm.siteId === null) {
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder("permission")
          .leftJoinAndSelect("permission.site", "site")
          .where("permission.permission = :permissionType")
          .andWhere("permission.site IS NULL")
          .setParameters({ permissionType: permissionType })
          .getOne();
      } else {
        site = await this.siteRepository.findOneBy({ id: perm.siteId })!;
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder("permission")
          .leftJoinAndSelect("permission.site", "site")
          .where("permission.permission = :permissionType")
          .andWhere("permission.site = :siteId")
          .setParameters({ permissionType: permissionType, siteId: perm.siteId })
          .getOne();
      }
      if (!permissionCandidate) {
        try {
          permission = await this.permissionRepository.save({
            permission: permissionType,
            site: site,
          });
        } catch (err) {
          console.error(err);
          return next({ status: 500, errors: err });
        }
      } else {
        permission = permissionCandidate;
      }
      permissions.push(permission);
    }
    res.locals.permissions = permissions;
  }

  async usernameAvailable(username: string): Promise<boolean> {
    const usernameTaken = await this.userAccountRepository.existsBy({ username });
    return !usernameTaken;
  }

  putUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
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
      await this.createPermissions(req, res, next);
      user.permissions = res.locals.permissions;
    }
    await this.userAccountRepository.save(user);
    res.json(this.userResponse(user));
  };

  getUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const user = await this.userAccountRepository.findOne({
      where: { id: Number(req.params.id) },
      relations: { permissions: { site: true } },
    });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    res.json(this.userResponse(user));
  };

  deleteUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const user = await this.userAccountRepository.findOneBy({ id: Number(req.params.id) });
    if (!user) return next({ status: 404, errors: "UserAccount not found" });
    await this.userAccountRepository.remove(user);
    res.sendStatus(200);
  };

  getAllUserAccounts: RequestHandler = async (req: Request, res: Response) => {
    const users = await this.userAccountRepository.find({ relations: { permissions: { site: true } } });
    res.json(users.map((u) => this.userResponse(u)));
  };

  validatePost: RequestHandler = async (req: Request, res: Response, next) => {
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

  validatePut = async (req: Request, res: Response, next: NextFunction) => {
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

  validatePermissions = async (req: Request, res: Response, next: NextFunction) => {
    if (Array.isArray(req.body.permissions)) {
      await this.validatePermissionList(req, res, next);
    } else {
      return next({ status: 401, errors: "Give permissions as a list" });
    }
  };

  validatePermissionList = async (req: Request, res: Response, next: NextFunction) => {
    for (const permission of req.body.permissions) {
      res.locals.permission = permission;
      await this.validatePermission(req, res, next);
    }
  };

  validatePermission = async (req: Request, res: Response, next: NextFunction) => {
    const permission = res.locals.permission;
    if (!hasProperty(permission, "siteId")) {
      return next({ status: 401, errors: "Missing the siteId from permission" });
    }
    if (!hasProperty(permission, "permission")) {
      return next({ status: 401, errors: "Missing the permission type from permission" });
    }
    if (permission.siteId !== null) {
      const site = await this.siteRepository.findOneBy({ id: permission.siteId });
      if (!site) {
        return next({ status: 422, errors: "SiteId does not exist" });
      }
    }
    if (permissionTypeFromString(permission.permission) === undefined) {
      return next({ status: 422, errors: "Unexpected permission type" });
    }
  };

  userInfo: RequestHandler = async (req: Request, res: Response, next) => {
    try {
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
    } catch (err) {
      next({ status: 500, errors: `Internal server error: ${err}` });
    }
  };
}
