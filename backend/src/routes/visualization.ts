import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'
import {checkFileExists, hideTestDataFromNormalUsers, rowExists} from '../lib'
import {Visualization} from '../entity/Visualization'
import {VisualizationResponse} from '../entity/VisualizationResponse'
import {FileRoutes} from './file'
import {ModelFile, RegularFile} from '../entity/File'
import {ProductVariable} from '../entity/ProductVariable'
import {ModelVisualization} from '../entity/ModelVisualization'

export class VisualizationRoutes {

  constructor(conn: Connection, fileController: FileRoutes) {
    this.conn = conn
    this.fileRepo = conn.getRepository<RegularFile>('regular_file')
    this.modelFileRepo = conn.getRepository<ModelFile>('model_file')
    this.visualizationRepo = conn.getRepository<Visualization>('visualization')
    this.modelVisualizationRepo = conn.getRepository<ModelVisualization>('model_visualization')
    this.productVariableRepo = conn.getRepository<ProductVariable>('product_variable')
    this.fileController = fileController
  }

  readonly conn: Connection
  readonly fileRepo: Repository<RegularFile>
  readonly modelFileRepo: Repository<ModelFile>
  readonly visualizationRepo: Repository<Visualization>
  readonly modelVisualizationRepo: Repository<ModelVisualization>
  readonly productVariableRepo: Repository<ProductVariable>
  readonly fileController: FileRoutes

  putVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    const s3key = req.params[0]
    Promise.all([
      this.fileController.findAnyFile(repo => repo.findOne(body.sourceFileId, {relations: ['product']})),
      this.productVariableRepo.findOneOrFail(body.variableId),
      checkFileExists('cloudnet-img', s3key)
    ])
      .then(([file, productVariable, _]) => {
        if (!file) throw Error('Source file not found')

        let insert
        if (file.product.id == 'model') {
          const viz = new ModelVisualization(req.params[0], file as ModelFile, productVariable)
          insert =  this.modelVisualizationRepo.insert(viz)
        } else {
          const viz = new Visualization(req.params[0], file, productVariable)
          insert =  this.visualizationRepo.insert(viz)
        }

        insert.then(_ => res.sendStatus(201))
          .catch(err => {
            if (rowExists(err)) return res.sendStatus(200)
            return next({status: 500, errors: err})
          })
      })
      .catch((err: any) => next({ status: 400, errors: err}))
  }

  visualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.getManyVisualizations(query)
      .then(result =>
        res.send(result
          .map(file => new VisualizationResponse(file))))
      .catch(err => next({ status: 500, errors: err }))
  }

  visualizationForSourceFile: RequestHandler = async (req: Request, res: Response, next) => {
    const params = req.params
    const fetchVisualizationsForSourceFile = (repo: Repository<RegularFile|ModelFile>) => {
      const qb = repo.createQueryBuilder('file')
        .leftJoinAndSelect('file.visualizations', 'visualizations')
        .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
        .leftJoinAndSelect('file.site', 'site')
        .leftJoinAndSelect('file.product', 'product')
        .where('file.uuid = :uuid', params)
      return hideTestDataFromNormalUsers(qb, req)
        .getOne()
    }

    this.fileController.findAnyFile(fetchVisualizationsForSourceFile)
      .then(file => {
        if (file == undefined) {
          next({status: 404, errors: ['No files match the query'], params})
          return
        }
        res.send(new VisualizationResponse(file))
      })
      .catch(err => next({status: 500, errors: err}))
  }

  private getManyVisualizations(query: any) {
    const fetchVisualizations = (_repo: Repository<RegularFile|ModelFile>, mode: boolean | undefined) => {
      let qb = this.fileController.filesQueryBuilder(query, mode ? 'model' : 'file')
        .innerJoinAndSelect('file.visualizations', 'visualizations')
        .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
      if ('variable' in query && query.variable.length) qb = qb.andWhere('product_variable.id IN (:...variable)', query)
      return qb.getMany()
    }
    return this.fileController.findAllFiles(fetchVisualizations)
  }

}
