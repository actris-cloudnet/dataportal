import {Request, RequestHandler, Response} from 'express'
import {Connection} from 'typeorm'
import {fetchAll} from '../lib'
import {Instrument} from '../entity/Instrument'
import {Product} from '../entity/Product'

export class InstrumentController {

  constructor(conn: Connection) {
    this.conn = conn
  }

  readonly conn: Connection

  instruments: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Instrument)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
