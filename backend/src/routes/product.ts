import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { Product } from "../entity/Product";

export class ProductRoutes {
  constructor(dataSource: DataSource) {
    this.productRepo = dataSource.getRepository(Product);
  }

  readonly productRepo: Repository<Product>;

  products: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const products = await this.productRepo.find({ order: { level: "DESC", id: "ASC" } });
      res.send(products);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  product: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const product = await this.productRepo.findOne({
        where: { id: req.params.productId },
        relations: { sourceInstruments: true, sourceProducts: true, derivedProducts: true },
      });
      if (!product) {
        return next({ status: 404, errors: ["No product match this id"] });
      }
      res.send(product);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  productVariables: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const products = await this.productRepo.find({
        relations: { variables: true },
        order: {
          level: "DESC",
          id: "ASC",
          variables: { order: "ASC" },
        },
      });
      res.send(products);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };
}
