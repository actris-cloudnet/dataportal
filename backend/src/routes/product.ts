import {Request, RequestHandler, Response} from 'express'
import {Connection} from 'typeorm'
import {fetchAll} from '../lib'
import {Product} from '../entity/Product'

export class ProductController {

  constructor(conn: Connection) {
    this.conn = conn
  }

  readonly conn: Connection

  products: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  productVariables: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product, {relations: ['variables']})
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

}
