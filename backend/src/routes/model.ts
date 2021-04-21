import {Connection} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
  }

  private conn: Connection

  models: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.conn.getRepository('model')
      .createQueryBuilder('model')
    if (req.query.showCitations) qb.leftJoinAndSelect('model.citations', 'citations')
    else qb.select()

      qb.addOrderBy('model.optimumOrder', 'ASC')
      .addOrderBy('model.id', 'ASC')
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
