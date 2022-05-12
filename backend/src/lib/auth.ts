import { Connection, Repository } from 'typeorm'
import { RequestHandler } from 'express'
import { UserAccount } from '../entity/UserAccount'
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
      res.status(401).send('Unauthorized')
      return
    }
    let userAccount: UserAccount | undefined = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .where('user_account.username = :username', { username: credentials.name })
      .getOne()
    // Check that user exists in the database
    if (userAccount === undefined) {
      res.status(401).send('Unauthorized')
      return
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
      res.status(401).send('Unauthorized')
      return
    }
  }
}

export class Authorizator {
  private userAccountRepository: Repository<UserAccount>
  private siteRepository: Repository<Site>

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
    this.siteRepository = conn.getRepository<Site>('site')
  }

  uploadMiddleware: RequestHandler = async (req, res, next) => {
    // Authenticator should handle authentication first and add username into res.locals
    if (!res.locals.authenticated || !res.locals.username) {
      console.error('Authorizator received unauthenticated request')
      res.status(401).send('Unauthorized')
      return
    }

    // Handle legacy upload
    let site: Site
    if (!req.body || !req.body.site) {
      console.log('Hoi from Authorizator, no site in body', res.locals.username)
      // username should match some site
      const siteCandidate: Site | undefined = await this.siteRepository.findOne(res.locals.username)
      if (siteCandidate === undefined) {
        res.status(400).send('Bad request: Add site')
        return
      }
      site = siteCandidate!
    } else {
      const siteCandidate: Site | undefined = await this.siteRepository.findOne(req.body.site)
      if (siteCandidate === undefined) {
        res.status(400).send('Bad request: site does not exist')
        return
      }
      site = siteCandidate!
    }
    // check that username has permission for the given site
    const userWithProperPermission = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .leftJoinAndSelect('user_account.permissions', 'permission')
      .leftJoinAndSelect('permission.site', 'site')
      .where('user_account.username = :username')
      .andWhere('site IS NULL OR site.id = :siteId')
      .setParameters({ username: res.locals.username, siteId: site.id })
      .getOne()
    if (userWithProperPermission === undefined) {
      res.status(401).send('Unauthorized: missing permission to upload for the site')
      return
    }
    return next()
  }
  modelUploadMiddleware: RequestHandler = async (req, res, next) => {
    return next()
  }
}
