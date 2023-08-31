import { Request, RequestHandler, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { checkFileExists, getS3pathForImage, hideTestDataFromNormalUsers } from "../lib";
import { Visualization } from "../entity/Visualization";
import { VisualizationResponse } from "../entity/VisualizationResponse";
import { FileRoutes } from "./file";
import { ModelFile, RegularFile } from "../entity/File";
import { ProductVariable } from "../entity/ProductVariable";
import { ModelVisualization } from "../entity/ModelVisualization";

export class VisualizationRoutes {
  constructor(dataSource: DataSource, fileController: FileRoutes) {
    this.fileRepo = dataSource.getRepository(RegularFile);
    this.modelFileRepo = dataSource.getRepository(ModelFile);
    this.visualizationRepo = dataSource.getRepository(Visualization);
    this.modelVisualizationRepo = dataSource.getRepository(ModelVisualization);
    this.productVariableRepo = dataSource.getRepository(ProductVariable);
    this.fileController = fileController;
  }

  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly visualizationRepo: Repository<Visualization>;
  readonly modelVisualizationRepo: Repository<ModelVisualization>;
  readonly productVariableRepo: Repository<ProductVariable>;
  readonly fileController: FileRoutes;

  putVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body;
    const s3key = req.params[0];
    try {
      await checkFileExists(getS3pathForImage(s3key));
    } catch (err) {
      return next({ status: 400, errors: err });
    }
    try {
      const [file, productVariable] = await Promise.all([
        this.fileController.findAnyFile((repo) =>
          repo.findOne({ where: { uuid: body.sourceFileId }, relations: { product: true } })
        ),
        this.productVariableRepo.findOneBy({ id: body.variableId }),
      ]);
      if (!file) {
        return next({ status: 400, errors: "Source file not found" });
      }
      if (!productVariable) {
        return next({ status: 400, errors: "Variable not found" });
      }

      if (file.product.id == "model") {
        const viz = new ModelVisualization(req.params[0], file as ModelFile, productVariable, body.dimensions);
        await this.modelVisualizationRepo.save(viz);
      } else {
        const viz = new Visualization(req.params[0], file, productVariable, body.dimensions);
        await this.visualizationRepo.save(viz);
      }

      res.sendStatus(201);
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  visualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query;
    try {
      const visualizations = await this.getManyVisualizations(query);
      res.send(visualizations.map((file) => new VisualizationResponse(file)));
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  visualizationForSourceFile: RequestHandler = async (req: Request, res: Response, next) => {
    const params = req.params;
    const fetchVisualizationsForSourceFile = (repo: Repository<RegularFile | ModelFile>) => {
      const qb = repo
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.visualizations", "visualizations")
        .leftJoinAndSelect("visualizations.productVariable", "product_variable")
        .leftJoinAndSelect("file.site", "site")
        .leftJoinAndSelect("file.product", "product")
        .where("file.uuid = :uuid", params)
        .addOrderBy("product_variable.order", "ASC");
      return hideTestDataFromNormalUsers(qb, req).getOne();
    };

    try {
      const file = await this.fileController.findAnyFile(fetchVisualizationsForSourceFile);
      if (!file) {
        return next({ status: 404, errors: ["No files match the query"], params });
      }
      res.send(new VisualizationResponse(file));
    } catch (err) {
      next({ status: 500, errors: err });
    }
  };

  private getManyVisualizations(query: any) {
    const fetchVisualizations = (_repo: Repository<RegularFile | ModelFile>, mode: boolean | undefined) => {
      let qb = this.fileController
        .filesQueryBuilder(query, mode ? "model" : "file")
        .innerJoinAndSelect("file.visualizations", "visualizations")
        .leftJoinAndSelect("visualizations.productVariable", "product_variable")
        .addOrderBy("product_variable.order", "ASC");
      if ("variable" in query && query.variable.length)
        qb = qb.andWhere("product_variable.id IN (:...variable)", query);
      return qb.getMany();
    };
    return this.fileController.findAllFiles(fetchVisualizations);
  }
}
