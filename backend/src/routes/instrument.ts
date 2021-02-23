import {Request, RequestHandler, Response} from 'express'
import {Connection} from 'typeorm'

export class InstrumentRoutes {

  constructor(conn: Connection) {
    this.conn = conn
  }

  readonly conn: Connection

  instruments: RequestHandler = async (_req: Request, res: Response, next) => {
    this.conn.getRepository('instrument')
      .createQueryBuilder('instrument')
      .select()
      .addOrderBy('instrument.type', 'ASC')
      .addOrderBy('instrument.id', 'ASC')
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
