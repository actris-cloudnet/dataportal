import {Request, RequestHandler, Response} from 'express'
import {Connection} from 'typeorm'
import {fetchAll} from '../lib'
import {Product} from '../entity/Product'

export class ProductRoutes {

  constructor(conn: Connection) {
    this.conn = conn
  }

  readonly conn: Connection

  products: RequestHandler = async (req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product, {order: {level: 'DESC', id: 'ASC'}})
      .then(this.filterProducts(req))
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  productVariables: RequestHandler = async (req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product, {relations: ['variables'], order: {level: 'DESC', id: 'ASC'}})
      .then(this.filterProducts(req))
      .then(result => result.map(prod =>
        ({...prod,
          variables: prod.variables.sort((a, b) => parseInt(a.order) - parseInt(b.order))})))
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  private filterProducts = (req: Request) => {
    if (!req.query.developer)
      return (prods: Product[]) => prods.filter(prod => prod.level != '3')
    return (prods: Product[]) => prods
  }
}
