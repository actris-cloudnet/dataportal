import { Connection, Repository } from 'typeorm'
import * as md5 from 'apache-md5';
import {User} from '../entity/User'



export class Authenticator{
  private userRepository: Repository;

  constructor(conn: Connection){
    this.userRepository = conn.getRepository<User>('user')
  }

  authorizer(user: string, password: string): boolean {
    return false
  }
}
