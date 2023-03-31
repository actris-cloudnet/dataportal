import { Request, RequestHandler, Response } from "express";
import { Connection } from "typeorm";
import { fetchAll } from "../lib";
import { Product } from "../entity/Product";

export class ProductRoutes {
  constructor(conn: Connection) {
    this.conn = conn;
  }

  readonly conn: Connection;

  products: RequestHandler = async (req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product, { order: { level: "DESC", id: "ASC" } })
      .then((result) => res.send(result))
      .catch((err) => next({ status: 500, errors: err }));
  };

  productVariables: RequestHandler = async (req: Request, res: Response, next) => {
    // TODO: Need to use query builder with typeorm < 0.3.0
    this.conn
      .createQueryBuilder(Product, "product")
      .leftJoinAndSelect("product.variables", "product_variable")
      .addOrderBy("product.level", "DESC")
      .addOrderBy("product.id", "ASC")
      .addOrderBy("product_variable.order", "ASC")
      .getMany()
      .then((result) => res.send(result))
      .catch((err) => next({ status: 500, errors: err }));
  };
}
