import {Connection} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
  }

  private conn: Connection

  models: RequestHandler = async (_: Request, res: Response, next) => {
    this.conn.getRepository('model')
      .createQueryBuilder('model')
      .select()
      .addOrderBy('model.optimumOrder', 'ASC')
      .addOrderBy('model.id', 'ASC')
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
