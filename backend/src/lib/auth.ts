import { Connection, Repository } from 'typeorm'
import { RequestHandler } from 'express'
import { UserAccount } from '../entity/UserAccount'
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
    if (userAccount === undefined || credentials.name != userAccount!.username) {
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
      next()
      return
    } else {
      res.status(401).send('Unauthorized')
      return
    }
  }
}
