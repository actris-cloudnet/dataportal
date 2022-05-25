import { Connection, Repository } from 'typeorm'
import { Request, RequestHandler, Response } from 'express'

import { UserAccount } from '../entity/UserAccount'
import { Permission, PermissionType, permissionTypeFromString } from '../entity/Permission'
import { Site } from '../entity/Site'

interface UserAccountInterface {
  userId?: number
  username?: string
}

interface PermissionInterface {
  permission?: string
  siteId?: string | null
  userAccounts?: UserAccountInterface[]
}

interface UserPermissionInterface {
  permission?: string
  siteId?: string | null
}

interface UserAccountPermissionInterface {
  id?: number
  username?: string
  permissions?: UserPermissionInterface[]
}

export class UserAccountRoutes {
  private userAccountRepository: Repository<UserAccount>
  private permissionRepository: Repository<Permission>
  private siteRepository: Repository<Site>

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
    this.permissionRepository = conn.getRepository<Permission>('permission')
    this.siteRepository = conn.getRepository<Site>('site')
  }

  postUser: RequestHandler = async (req: Request, res: Response) => {
    // Expects valid array of "user:passwordHash" strings in the req.body
    // Validity should be checked in middleware earlier
    for (let credentialString of req.body) {
      const [username, passwordHash] = credentialString.split(':')
      try {
        await this.userAccountRepository.save({
          username: username,
          passwordHash: passwordHash,
        })
      } catch (err) {
        console.error(err)
        res.status(400).send('Bad request: cannot save user into the database\n')
        return
      }
    }

    res.status(200).send('Users created successfully\n')
  }

  postUserCheckDuplicates: RequestHandler = async (req: Request, res: Response, next) => {
    // Expects valid array of "user:passwordHash" strings in the req.body
    // Validity should be checked in middleware earlier
    let reqUsers = new Set<string>()
    for (let credentialString of req.body) {
      const username: string = credentialString.split(':')[0]

      const user = await this.userAccountRepository.findOne({username:username})
      if (user !== undefined) {
        res.status(400).send('Bad request: some user accounts already exists in the database\n')
        return
      }
      if (reqUsers.has(username)) {
        res.status(400).send('Bad request: contains duplicate users\n')
        return
      }
      reqUsers.add(username)
    }
    next()
  }

  postUserValidateFormat: RequestHandler = async (req: Request, res: Response, next) => {
    if (!Array.isArray(req.body)) {
      res.status(400).send('Bad request: json should be an array\n')
      return
    }
    for (let element of req.body) {
      if (!(typeof element === 'string')) {
        res.status(400).send('Bad request: elements of the array should be strings\n')
        return
      }
      // elements should be in form: "username:passwordHash"
      const arr = element.split(':')
      if (arr.length != 2) {
        res.status(400).send('Bad request: strings should be in a format: "username:passwordHash"\n')
        return
      }
      const hash = arr[1]
      const hashArr = hash.split('$')
      if (hashArr.length != 4) {
        res.status(400).send('Bad request: hash should be in format: "$method$salt$hash"\n')
        return
      }
      const hashMethod = hashArr[1]
      if (hashMethod !== 'apr1') {
        res.status(400).send('Bad request: hash not supported\n')
        return
      }
    }
    next()
  }

  deleteUserById: RequestHandler = async (req: Request, res: Response) => {
    try {
      await this.userAccountRepository
        .createQueryBuilder()
        .delete()
        .from(UserAccount)
        .where('id = :id', { id: req.params.id })
        .execute()
    } catch {
      res.status(400).send('Bad request: cannot delete the user\n')
    }
    res.status(200).send('User deleted\n')
  }

  getAllUsers: RequestHandler = async (req: Request, res: Response) => {
    try {
      const users: UserAccount[] = await this.userAccountRepository.createQueryBuilder('user_account').getMany()
      const returnUsers: UserAccountPermissionInterface[] = users.map((u) => ({
        id: u.id,
        username: u.username,
      }))
      res.json(returnUsers)
      return
    } catch {
      res.status(400).send('Bad request: cannot get users from the database\n')
    }
  }

  postPermission: RequestHandler = async (req: Request, res: Response) => {
    // Expects request with valid user, site and permission type
    // site can be undefined

    const user: UserAccount = (await this.userAccountRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.permissions', 'permission')
      .where('user.id = :id', { id: req.params.id })
      .getOne()) as UserAccount

    const perm: PermissionType = permissionTypeFromString(req.body.permission as string)!
    let permission: Permission | undefined

    if (req.body.siteId === undefined) {
      permission = await this.permissionRepository
        .createQueryBuilder('permission')
        .leftJoinAndSelect('permission.site', 'site')
        .where('permission.permission = :perm')
        .andWhere('permission.site IS NULL')
        .setParameters({ perm: perm })
        .getOne()
      if (permission === undefined) {
        permission = await this.permissionRepository.save({
          permission: perm,
          site: undefined,
        })
      }
    } else {
      const site: Site = (await this.siteRepository
        .createQueryBuilder('site')
        .where('site.id = :siteId', { siteId: req.body.siteId })
        .getOne()) as Site
      permission = await this.permissionRepository
        .createQueryBuilder('permission')
        .leftJoinAndSelect('permission.site', 'site')
        .where('permission.permission = :perm')
        .andWhere('permission.site = :siteId')
        .setParameters({ perm: perm, siteId: site.id })
        .getOne()
      if (permission === undefined) {
        permission = await this.permissionRepository.save({
          permission: perm,
          site: site,
        })
      }
    }

    const userWithPermission = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .leftJoinAndSelect('user_account.permissions', 'permission')
      .where('user_account.id = :userId')
      .andWhere('permission.id = :permId')
      .setParameters({ userId: user.id, permId: permission.id })
      .getOne()

    if (userWithPermission === undefined) {
      await this.userAccountRepository
        .createQueryBuilder()
        .relation(UserAccount, 'permissions')
        .of(user)
        .add(permission)
      res.status(200).send('Permission added\n')
      return
    } else {
      res.status(200).send('User already has the permission\n')
    }
  }

  postPermissionValidate: RequestHandler = async (req: Request, res: Response, next) => {
    const user: UserAccount | undefined = await this.userAccountRepository.findOne(req.params.id)
    if (user === undefined) {
      res.status(400).send('Bad request: User with requested ID does not exist\n')
      return
    }
    if (req.body.siteId !== undefined) {
      if (typeof req.body.siteId !== 'string') {
        res.status(400).send('Bad request: specify only one siteId per request\n')
        return
      }
      let site = await this.siteRepository
        .createQueryBuilder('site')
        .where('site.id = :siteId', { siteId: req.body.siteId })
        .getOne()
      if (site === undefined) {
        res.status(400).send('Bad request: unexpected siteId\n')
        return
      }
    }
    if (req.body.permission === undefined || typeof req.body.permission !== 'string') {
      res.status(400).send('Bad request: define exactly one permission per request\n')
      return
    }
    if (permissionTypeFromString(req.body.permission) === undefined) {
      res.status(400).send('Bad request: unexpected permission type\n')
      return
    }
    next()
  }

  deletePermissions: RequestHandler = async (req: Request, res: Response) => {
    const user: UserAccount | undefined = await this.userAccountRepository.findOne(req.params.id, {
      relations: ['permissions'],
    })
    if (user === undefined) {
      res.status(400).send('Bad request: user does not exist\n')
      return
    }
    user.permissions = []
    await this.userAccountRepository.save(user)
    res.status(200).send('User permissions removed\n')
  }

  getPermissions: RequestHandler = async (req: Request, res: Response) => {
    const user: UserAccount | undefined = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .leftJoinAndSelect('user_account.permissions', 'permission')
      .leftJoinAndSelect('permission.site', 'site')
      .where('user_account.id = :id', { id: req.params.id })
      .getOne()

    if (user === undefined) {
      res.status(400).send('Bad request: user does not exist\n')
      return
    }
    const permissions: PermissionInterface[] = user.permissions.map((p) =>
      p.site
        ? {
          permission: p.permission,
          siteId: p.site.id,
        }
        : {
          permission: p.permission,
          siteId: null,
        }
    )
    res.json({
      id: user.id,
      username: user.username,
      permissions: permissions,
    })
  }
  getAllPermissions: RequestHandler = async (req: Request, res: Response) => {
    const perms = await this.permissionRepository.find({
      relations: ['userAccounts', 'site'],
    })
    const respData: PermissionInterface[] = perms.map((p) => ({
      permission: p.permission,
      siteId: p.site ? p.site.id : null,
      userAccounts: p.userAccounts.map((user) => ({
        userId: user.id,
        username: user.username,
      })),
    }))

    res.json(respData)
    return
  }
  deleteAllUnusedPermissions: RequestHandler = async (req: Request, res: Response) => {
    const perms = await this.permissionRepository.find({
      relations: ['userAccounts'],
    })
    const unusedPerms = perms.filter((p) => p.userAccounts.length === 0)
    await this.permissionRepository.remove(unusedPerms)
    res.status(200).send('Unused permission removed\n')
  }
}
