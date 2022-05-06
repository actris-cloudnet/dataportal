import { Connection, Repository } from 'typeorm'
import { RequestHandler } from 'express'
import { UserAccount } from '../entity/UserAccount'
const auth = require('basic-auth')
const md5 = require('apache-md5')
const { timingSafeEqual } = require('crypto')
const { Buffer } = require('buffer')

const BYPASS_AUTHENTICATOR: boolean = true
const BYPASS_AUTHORIZATOR: boolean = true

export class Authenticator {
  private userAccountRepository: Repository<UserAccount>
  private logIdentifier: string
  private bypass: boolean

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
    this.logIdentifier = 'MessageFromAuthenticator: '
    this.bypass = BYPASS_AUTHENTICATOR
  }

  middleware: RequestHandler = async (req, res, next) => {
    // Check that request has credentials included
    let credentials = auth(req)
    if (!credentials) {
      if (this.bypass) {
        console.log(this.logIdentifier.concat('Unauthorized: no credentials'))
        next()
        return
      } else {
        res.status(401).send('Unauthorized')
        return
      }
    }
    let userAccount: UserAccount | undefined = await this.userAccountRepository
      .createQueryBuilder('user_account')
      .where('user_account.username = :username', { username: credentials.name })
      .getOne()
    // Check that user exists in the database
    if (userAccount === undefined) {
      if (this.bypass) {
        console.log(this.logIdentifier.concat('Unauthorized: username not found'))
        next()
        return
      } else {
        res.status(401).send('Unauthorized')
        return
      }
    }
    // Check that password in the request is correct
    if (
      timingSafeEqual(
        Buffer.from(md5(credentials.pass, userAccount!.passwordHash)),
        Buffer.from(userAccount!.passwordHash)
      )
    ) {
      if (this.bypass) {
        console.log(this.logIdentifier.concat('Authentication succesful')) // Remove when ready
        next()
        return
      } else {
        next()
        return
      }
    } else {
      if (this.bypass) {
        console.log(this.logIdentifier.concat('Unauthorized: passwordhashes unequal'))
        next()
        return
      } else {
        res.status(401).send('Unauthorized')
        return
      }
    }
  }
}
