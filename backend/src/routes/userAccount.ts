import { Connection, Repository } from "typeorm";
import { Request, RequestHandler, Response } from "express";

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

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>("user_account");
    this.permissionRepository = conn.getRepository<Permission>("permission");
    this.siteRepository = conn.getRepository<Site>("site");
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
    let user = await this.userAccountRepository.findOne(
      { username: req.body.username },
      { relations: ["permissions", "permissions.site"] }
    );
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
  migrateLegacyPostUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const site = !["ewan", "simo"].includes(req.body.username)
      ? await this.siteRepository.findOne({ id: req.body.username })
      : null;
    if (site === undefined) {
      return next({ status: 404, errors: "Username does not match any site" });
    }
    let user = await this.userAccountRepository.findOne(
      { username: req.body.username },
      { relations: ["permissions", "permissions.site"] }
    );
    if (user !== undefined) {
      res.status(200);
      res.json(this.userResponse(user));
      return;
    }
    // Add proper permission to the body
    if (req.body.username === "simo") {
      req.body.permissions = [{ siteId: null, permission: "canUpload" }];
    } else if (req.body.username === "ewan") {
      req.body.permissions = [{ siteId: null, permission: "canUploadModel" }];
    } else {
      req.body.permissions = [{ siteId: site!.id, permission: "canUpload" }];
    }
    await this.createPermissions(req, res, next);
    user = await this.userAccountRepository.save({
      username: req.body.username,
      passwordHash: req.body.passwordHash,
      permissions: res.locals.permissions,
    });
    res.status(201);
    res.json(this.userResponse(user));
  };

  createPermissions: RequestHandler = async (req: Request, res: Response, next) => {
    let permissions: Permission[] = [];
    for (const perm of req.body.permissions) {
      let permission: Permission;
      const permissionType = permissionTypeFromString(perm.permission);
      let permissionCandidate: Permission | undefined;
      let site: Site | undefined;
      if (perm.siteId === null) {
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder("permission")
          .leftJoinAndSelect("permission.site", "site")
          .where("permission.permission = :permissionType")
          .andWhere("permission.site IS NULL")
          .setParameters({ permissionType: permissionType })
          .getOne();
      } else {
        site = await this.siteRepository.findOne({ id: perm.siteId })!;
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder("permission")
          .leftJoinAndSelect("permission.site", "site")
          .where("permission.permission = :permissionType")
          .andWhere("permission.site = :siteId")
          .setParameters({ permissionType: permissionType, siteId: perm.siteId })
          .getOne();
      }
      if (permissionCandidate === undefined) {
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
  };

  usernameAvailable = async (username: string): Promise<boolean> => {
    const user = await this.userAccountRepository.findOne({ username: username });
    return user === undefined ? true : false;
  };

  putUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    let user = await this.userAccountRepository.findOne(
      { id: Number(req.params.id) },
      { relations: ["permissions", "permissions.site"] }
    );
    if (user === undefined) {
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
    const user = await this.userAccountRepository.findOne(
      { id: Number(req.params.id) },
      { relations: ["permissions", "permissions.site"] }
    );
    if (user !== undefined) {
      res.json(this.userResponse(user));
    } else {
      return next({ status: 404, errors: "UserAccount not found" });
    }
  };
  deleteUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const user = await this.userAccountRepository.findOne({ id: Number(req.params.id) });
    if (user !== undefined) {
      await this.userAccountRepository.remove(user);
      res.sendStatus(200);
    } else {
      return next({ status: 404, errors: "UserAccount not found" });
    }
  };

  getAllUserAccounts: RequestHandler = async (req: Request, res: Response) => {
    const users = await this.userAccountRepository.find({ relations: ["permissions", "permissions.site"] });
    res.json(users.map((u) => this.userResponse(u)));
  };

  validatePost: RequestHandler = async (req: Request, res: Response, next) => {
    if (!hasProperty(req.body, "username")) {
      return next({ status: 401, errors: "Missing the username" });
    }
    await this.validateUsername(req, res, next);
    if (hasProperty(req.body, "password")) {
      await this.validatePassword(req, res, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    return next();
  };
  validateMigrateLegacyPost: RequestHandler = async (req: Request, res: Response, next) => {
    if (!hasProperty(req.body, "username")) {
      return next({ status: 401, errors: "Missing the username" });
    }
    await this.validateUsername(req, res, next);
    if (!hasProperty(req.body, "passwordHash")) {
      return next({ status: 401, errors: "Missing the passwordHash" });
    }
    await this.validatePasswordHash(req, res, next);
    return next();
  };
  validatePut: RequestHandler = async (req: Request, res: Response, next) => {
    if (hasProperty(req.body, "username")) {
      await this.validateUsername(req, res, next);
    }
    if (hasProperty(req.body, "password")) {
      await this.validatePassword(req, res, next);
    }

    if (hasProperty(req.body, "permissions")) {
      await this.validatePermissions(req, res, next);
    }
    return next();
  };

  validateUsername: RequestHandler = async (req: Request, res: Response, next) => {
    if (typeof req.body.username !== "string") {
      return next({ status: 401, errors: "username must be a string" });
    } else if (req.body.username.length === 0) {
      return next({ status: 401, errors: "username must be nonempty" });
    }
  };
  validatePassword: RequestHandler = async (req: Request, res: Response, next) => {
    if (typeof req.body.password !== "string") {
      return next({ status: 401, errors: "password must be a string" });
    } else if (req.body.password.length === 0) {
      return next({ status: 401, errors: "password must be nonempty" });
    }
  };
  validatePasswordHash: RequestHandler = async (req: Request, res: Response, next) => {
    if (typeof req.body.passwordHash !== "string") {
      return next({ status: 401, errors: "passwordHash must be a string" });
    } else if (req.body.passwordHash.length === 0) {
      return next({ status: 401, errors: "passwordHash must be nonempty" });
    } else if (!/^\$apr1\$.+\$.+$/.test(req.body.passwordHash)) {
      return next({ status: 401, errors: "passwordHash has an unexpected form" });
    }
  };

  validatePermissions: RequestHandler = async (req: Request, res: Response, next) => {
    if (Array.isArray(req.body.permissions)) {
      await this.validatePermissionList(req, res, next);
    } else {
      return next({ status: 401, errors: "Give permissions as a list" });
    }
  };
  validatePermissionList: RequestHandler = async (req: Request, res: Response, next) => {
    for (const permission of req.body.permissions) {
      res.locals.permission = permission;
      await this.validatePermission(req, res, next);
    }
  };
  validatePermission: RequestHandler = async (req: Request, res: Response, next) => {
    const permission = res.locals.permission;
    if (!hasProperty(permission, "siteId")) {
      return next({ status: 401, errors: "Missing the siteId from permission" });
    }
    if (!hasProperty(permission, "permission")) {
      return next({ status: 401, errors: "Missing the permission type from permission" });
    }
    if (permission.siteId !== null) {
      let site = await this.siteRepository.findOne({ id: permission.siteId });
      if (site === undefined) {
        return next({ status: 422, errors: "SiteId does not exist" });
      }
    }
    if (permissionTypeFromString(permission.permission) === undefined) {
      return next({ status: 422, errors: "Unexpected permission type" });
    }
    return;
  };
}
