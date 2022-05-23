import { Connection, Repository } from 'typeorm'
import { Request, RequestHandler, Response } from 'express'

import { UserAccount } from '../entity/UserAccount'
import { Permission, PermissionType, permissionTypeFromString } from '../entity/Permission'
import { Site } from '../entity/Site'

const md5 = require('apache-md5')

interface PermissionInterface {
  id?: number
  permission: PermissionType
  siteId: string | null
}

interface UserAccountInterface {
  id?: number
  username: string
  password?: string
  passwordHash?: string
  permissions: PermissionInterface[]
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
  userResponse = (user: UserAccount): UserAccountInterface => {
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      permissions: user.permissions.map((p) => ({
        id: p.id,
        permission: p.permission,
        siteId: p.site ? p.site.id : null,
      })),
    }
  }
  postUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    var user = await this.userAccountRepository.findOne(
      { username: req.body.username },
      { relations: ['permissions', 'permissions.site'] }
    )
    if (user !== undefined) {
      res.status(200)
      res.json(this.userResponse(user))
      return
    }
    let permissions: Permission[] = []
    for (const perm of req.body.permissions) {
      let permission: Permission
      const permissionType = permissionTypeFromString(perm.permission)
      let permissionCandidate: Permission | undefined
      let site: Site | undefined
      if (perm.siteId === null) {
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder('permission')
          .leftJoinAndSelect('permission.site', 'site')
          .where('permission.permission = :permissionType')
          .andWhere('permission.site IS NULL')
          .setParameters({ permissionType: permissionType })
          .getOne()
      } else {
        site = await this.siteRepository.findOne({ id: perm.siteId })!
        permissionCandidate = await this.permissionRepository
          .createQueryBuilder('permission')
          .leftJoinAndSelect('permission.site', 'site')
          .where('permission.permission = :permissionType')
          .andWhere('permission.site = :siteId')
          .setParameters({ permissionType: permissionType, siteId: perm.siteId })
          .getOne()
      }
      if (permissionCandidate === undefined) {
        try {
          permission = await this.permissionRepository.save({
            permission: permissionType,
            site: site,
          })
          console.log('save permission: ', permission)
        } catch (err) {
          console.error(err)
          return next({ status: 500, errors: err })
        }
      } else {
        permission = permissionCandidate
      }
      permissions.push(permission)
    }
    user = await this.userAccountRepository.save({
      username: req.body.username,
      passwordHash: md5(req.body.password),
      permissions: permissions,
    })
    res.status(201)
    res.json(this.userResponse(user))
  }

  getUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const user = await this.userAccountRepository.findOne(
      { id: req.params.id },
      { relations: ['permissions', 'permissions.site'] }
    )
    if (user !== undefined) {
      res.json(this.userResponse(user))
    } else {
      return next({ status: 404, errors: 'UserAccount not found' })
    }
  }
  deleteUserAccount: RequestHandler = async (req: Request, res: Response, next) => {
    const user = await this.userAccountRepository.findOne({ id: req.params.id })
    if (user !== undefined) {
      await this.userAccountRepository.remove(user)
      res.sendStatus(200)
    } else {
      return next({ status: 404, errors: 'UserAccount not found' })
    }
  }
  validatePost: RequestHandler = async (req: Request, res: Response, next) => {
    if (!req.body.hasOwnProperty('username')) {
      return next({ status: 401, errors: 'Missing the username' })
    } else if (typeof req.body.username !== 'string') {
      return next({ status: 401, errors: 'username must be a string' })
    } else if (req.body.username.length === 0) {
      return next({ status: 401, errors: 'username must be nonempty' })
    }
    if (!req.body.hasOwnProperty('password')) {
      return next({ status: 401, errors: 'Missing the password' })
    } else if (typeof req.body.password !== 'string') {
      return next({ status: 401, errors: 'password must be a string' })
    } else if (req.body.password.length === 0) {
      return next({ status: 401, errors: 'password must be nonempty' })
    }
    if (req.body.hasOwnProperty('permissions')) {
      if (Array.isArray(req.body.permissions)) {
        await this.validatePermissionList(req, res, next)
      } else {
        return next({ status: 401, errors: 'Give permissions as a list' })
      }
    }
    return next()
  }
  validatePermissionList: RequestHandler = async (req: Request, res: Response, next) => {
    for (const permission of req.body.permissions) {
      res.locals.permission = permission
      await this.validatePermission(req, res, next)
    }
  }
  validatePermission: RequestHandler = async (req: Request, res: Response, next) => {
    const permission = res.locals.permission
    if (!permission.hasOwnProperty('siteId')) {
      return next({ status: 401, errors: 'Missing the siteId from permission' })
    }
    if (!permission.hasOwnProperty('permission')) {
      return next({ status: 401, errors: 'Missing the permission type from permission' })
    }

    if (permission.siteId !== null) {
      let site = await this.siteRepository.findOne({ id: permission.siteId })
      if (site === undefined) {
        return next({ status: 422, errors: 'SiteId does not exist' })
      }
    }
    if (permissionTypeFromString(permission.permission) === undefined) {
      return next({ status: 422, errors: 'Unexpected permission type' })
    }
    return
  }
}
