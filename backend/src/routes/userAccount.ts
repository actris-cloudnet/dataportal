import { Connection, Repository } from 'typeorm'
import { Request, RequestHandler, Response } from 'express'

import {UserAccount} from '../entity/UserAccount'

export class UserAccountRoutes {
  private userAccountRepository: Repository<UserAccount>;

  constructor(conn: Connection) {
    this.userAccountRepository = conn.getRepository<UserAccount>('user_account')
  }

  postUser: RequestHandler = async (req: Request, res: Response) => {
    // Expects valid array of "user:passwordHash" strings in the req.body
    // Validity should be checked in middleware earlier
    for (let credentialString of req.body){
      let username: string
      let passwordHash: string
      [username, passwordHash] = credentialString.split(':')
      try {
        await this.userAccountRepository.save({
          username: username,
          passwordHash: passwordHash,
        })
      } catch(err){
        console.log(err)
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
    for (let credentialString of req.body){
      const username: string = credentialString.split(':')[0]
      const user: UserAccount | undefined = await this.userAccountRepository
        .createQueryBuilder('user_account')
        .where('user_account.username = :username', {username: username})
        .getOne()
      if ( user !== undefined ){
        res.status(400).send('Bad request: some user accounts already exists in the database\n')
        return
      }
      if( reqUsers.has(username) ){
        res.status(400).send('Bad request: contains duplicate users\n')
        return
      }
      reqUsers.add(username)
    }
    next()
  }

  postUserValidateFormat: RequestHandler = async (req: Request, res: Response, next) => {
    if(!Array.isArray(req.body)){
      res.status(400).send('Bad request: json should be an array\n')
      return
    }
    for(let element of req.body){
      if(! (typeof element === 'string') ){
        res.status(400).send('Bad request: elements of the array should be strings\n')
        return
      }
      // elements should be in form: "username:passwordHash"
      const arr = element.split(':')
      if ( arr.length != 2 ){
        res.status(400).send('Bad request: strings should be in a format: "username:passwordHash"\n')
        return
      }
      const hash = arr[1]
      const hashArr = hash.split('$')
      if( hashArr.length != 4 ){
        res.status(400).send('Bad request: hash should be in format: "$method$salt$hash"\n')
        return
      }
      const hashMethod = hashArr[1]
      if( hashMethod !== 'apr1'){
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
        .where('id = :id', {id: req.params.id})
        .execute()
    } catch {
        res.status(400).send('Bad request: cannot delete the user\n')
    }
    res.status(200).send('User deleted\n')

  }

}
