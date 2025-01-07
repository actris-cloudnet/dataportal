import { RequestHandler } from "express";
import { DataSource, Repository } from "typeorm";
import { Product } from "../entity/Product";

export class ProductRoutes {
  constructor(dataSource: DataSource) {
    this.productRepo = dataSource.getRepository(Product);
  }

  readonly productRepo: Repository<Product>;

  products: RequestHandler = async (req, res) => {
    const products = await this.productRepo.find({
      select: { sourceInstruments: { id: true }, derivedProducts: { id: true }, sourceProducts: { id: true } },
      relations: { sourceInstruments: true, derivedProducts: true, sourceProducts: true },
      order: { level: "DESC", id: "ASC" },
    });
    res.send(
      products.map((product) => ({
        ...product,
        sourceInstruments: undefined,
        sourceInstrumentIds: product.sourceInstruments.map((instrument) => instrument.id),
        derivedProducts: undefined,
        derivedProductIds: product.derivedProducts.map((product) => product.id),
        sourceProducts: undefined,
        sourceProductIds: product.sourceProducts.map((product) => product.id),
      })),
    );
  };

  product: RequestHandler = async (req, res, next) => {
    const product = await this.productRepo.findOne({
      where: { id: req.params.productId },
      relations: { sourceInstruments: true, sourceProducts: true, derivedProducts: true },
    });
    if (!product) {
      return next({ status: 404, errors: ["No product match this id"] });
    }
    res.send(product);
  };

  productVariables: RequestHandler = async (req, res) => {
    const products = await this.productRepo.find({
      select: { sourceInstruments: { id: true } },
      relations: { variables: true, sourceInstruments: true },
      order: {
        level: "DESC",
        id: "ASC",
        variables: { order: "ASC" },
      },
    });
    res.send(
      products.map((product) => ({
        ...product,
        sourceInstruments: undefined,
        sourceInstrumentIds: product.sourceInstruments.map((instrument) => instrument.id),
      })),
    );
  };

  productVariable: RequestHandler = async (req, res, next) => {
    const productId = req.params.productId;
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: { variables: true },
      order: { variables: { order: "ASC" } },
    });
    if (!product) {
      return next({ status: 404, errors: ["No product match this id"] });
    }
    // Remove "productId-" prefix from variable ids
    product.variables.forEach((variable) => {
      variable.id = variable.id.replace(productId + "-", "");
    });
    res.send(product.variables);
  };
}
