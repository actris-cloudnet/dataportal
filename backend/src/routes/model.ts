import {Model} from '../entity/Model'
import {Upload} from '../entity/Upload'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {fetchAll, augmentFiles} from '../lib'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
  }

  private conn: Connection

  models: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<Model>(this.conn, Model)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
