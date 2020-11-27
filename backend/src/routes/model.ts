import {Model} from '../entity/Model'
import {Connection} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'
import {fetchAll} from '../lib'


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
