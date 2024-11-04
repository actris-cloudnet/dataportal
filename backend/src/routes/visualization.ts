import { Request, RequestHandler, Response } from "express";
import { DataSource, In, Repository } from "typeorm";
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
    const s3key = (req.params.s3key as unknown as string[]).join("/");
    try {
      await checkFileExists(getS3pathForImage(s3key));
    } catch (err) {
      return next({ status: 400, errors: err });
    }
    if (!body.sourceFileId) {
      return next({ status: 400, errors: "sourceFileId is missing" });
    }
    if (!body.variableId) {
      return next({ status: 400, errors: "variableId is missing" });
    }
    const [file, productVariable] = await Promise.all([
      this.fileController.findAnyFile((repo) => repo.findOne({ where: { uuid: body.sourceFileId } })),
      this.productVariableRepo.findOneBy({ id: body.variableId }),
    ]);
    if (!file) {
      return next({ status: 400, errors: "Source file not found" });
    }
    if (!productVariable) {
      return next({ status: 400, errors: "Variable not found" });
    }

    if (file instanceof ModelFile) {
      const viz = new ModelVisualization(s3key, file, productVariable, body.dimensions);
      await this.modelVisualizationRepo.save(viz);
    } else {
      const viz = new Visualization(s3key, file, productVariable, body.dimensions);
      await this.visualizationRepo.save(viz);
    }

    res.sendStatus(201);
  };

  visualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = res.locals;
    const visualizations = await this.getManyVisualizations(query);
    res.send(visualizations.map((file) => new VisualizationResponse(file)));
  };

  visualizationForSourceFile: RequestHandler = async (req: Request, res: Response, next) => {
    const params = req.params;
    const fetchVisualizationsForSourceFile = (repo: any) => {
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

    const file = await this.fileController.findAnyFile(fetchVisualizationsForSourceFile);
    if (!file) {
      return next({ status: 404, errors: ["No files match the query"], params });
    }
    res.send(new VisualizationResponse(file));
  };

  deleteVisualizations: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid = req.params.uuid;
    const images = req.query.images as string[];
    const file = await this.fileController.findAnyFile((repo) => repo.findOne({ where: { uuid } }));
    if (!file) return next({ status: 422, errors: ["No file matches the provided uuid"] });
    const visuRepo = file instanceof RegularFile ? this.visualizationRepo : this.modelVisualizationRepo;
    await visuRepo.delete({ sourceFile: { uuid }, productVariable: In(images) });
    res.sendStatus(200);
  };

  private getManyVisualizations(query: any) {
    const fetchVisualizations = (_repo: Repository<RegularFile> | Repository<ModelFile>, mode: boolean | undefined) => {
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
