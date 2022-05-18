import { Connection, Repository } from 'typeorm'
import { RequestHandler } from 'express'
import { UserAccount } from '../entity/UserAccount'
import { InstrumentUpload, ModelUpload } from '../entity/Upload'
import { PermissionType } from '../entity/Permission'
import { Site } from '../entity/Site'
const auth = require('basic-auth')
const md5 = require('apache-md5')
const { timingSafeEqual } = require('crypto')
const { Buffer } = require('buffer')

export class Authenticator {
  private userAccountRepository: Repository<UserAccount>

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
  }

  middleware: RequestHandler = async (req, res, next) => {
    // Check that request has credentials included
    let credentials = auth(req)
    if (!credentials) {
      return next({ status: 401, errors: 'Unauthorized' })
    }
    let userAccount: UserAccount | undefined = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .where('user_account.username = :username', { username: credentials.name })
      .getOne()
    // Check that user exists in the database
    if (userAccount === undefined) {
      return next({ status: 401, errors: 'Unauthorized' })
    }
    // Check that password in the request is correct
    if (
      timingSafeEqual(
        Buffer.from(md5(credentials.pass, userAccount!.passwordHash)),
        Buffer.from(userAccount!.passwordHash)
      )
    ) {
      res.locals.username = userAccount.username
      res.locals.authenticated = true
      next()
      return
    } else {
      return next({ status: 401, errors: 'Unauthorized' })
    }
  }
}

interface UploadMiddlewareParams {
  permission: PermissionType
  isDataUpload?: boolean
  isModelDataUpload?: boolean
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>
  private siteRepository: Repository<Site>
  private instrumentUploadRepository: Repository<InstrumentUpload>
  private modelUploadRepository: Repository<ModelUpload>

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
    this.siteRepository = conn.getRepository<Site>('site')
    this.instrumentUploadRepository = conn.getRepository<InstrumentUpload>('instrument_upload')
    this.modelUploadRepository = conn.getRepository<ModelUpload>('model_upload')
  }

  uploadMiddleware = ({
    permission,
    isDataUpload = false,
    isModelDataUpload = false,
  }: UploadMiddlewareParams): RequestHandler => {
    return async (req, res, next) => {
      // Authenticator should handle authentication first and add username into res.locals
      if (!res.locals.authenticated || !res.locals.username) {
        console.error('Authorizator received unauthenticated request')
        return next({ status: 401, errors: 'Unauthorized' })
      }

      let site: Site
      if (!isModelDataUpload && !isDataUpload) {
        if (
          !Object.prototype.hasOwnProperty.call(req, 'body') ||
          !Object.prototype.hasOwnProperty.call(req.body, 'site')
        ) {
          // Handle legacy upload
          // username should match some site
          const siteCandidate: Site | undefined = await this.siteRepository.findOne(res.locals.username)
          if (siteCandidate === undefined) {
            return next({ status: 400, errors: 'Add site to the request body' })
          }
          site = siteCandidate!
        } else {
          const siteCandidate: Site | undefined = await this.siteRepository.findOne(req.body.site)
          if (siteCandidate === undefined) {
            return next({ status: 422, errors: 'Site does not exist' })
          }
          site = siteCandidate!
        }
      } else {
        if (isDataUpload) {
          const uploadCandidate: InstrumentUpload | undefined = await this.instrumentUploadRepository.findOne(
            { checksum: req.params.checksum },
            { relations: ['site'] }
          )
          if (uploadCandidate === undefined) {
            return next({ status: 422, errors: 'Checksum does not exist in the database' })
          }
          site = uploadCandidate!.site
        } else if (isModelDataUpload) {
          // modeldata upload checks site from db based on the checksum
          const modelUploadCandidate: ModelUpload | undefined = await this.modelUploadRepository.findOne(
            { checksum: req.params.checksum },
            { relations: ['site'] }
          )
          if (modelUploadCandidate === undefined) {
            return next({ status: 422, errors: 'Checksum does not exist in the database' })
          }
          site = modelUploadCandidate!.site
        } else {
          return next({ status: 500, errors: 'Oops, something went wrong' })
        }
      }
      // check that username has permission for the given site
      const userWithProperPermission = await this.userAccountRepository
        .createQueryBuilder('user_account')
        .leftJoinAndSelect('user_account.permissions', 'permission')
        .leftJoinAndSelect('permission.site', 'site')
        .where('user_account.username = :username')
        .andWhere('site IS NULL OR site.id = :siteId')
        .andWhere('permission.permission = :permission')
        .setParameters({ username: res.locals.username, siteId: site.id, permission: permission })
        .getOne()
      if (userWithProperPermission === undefined) {
        return next({ status: 401, errors: 'Missing permission' })
      }
      req.params.site = site.id
      return next()
    }
  }
}
