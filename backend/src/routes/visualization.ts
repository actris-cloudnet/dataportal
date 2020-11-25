import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository, SelectQueryBuilder} from 'typeorm'
import {hideTestDataFromNormalUsers, linkFile} from '../lib'
import {join} from 'path'
import config from '../config'
import {Visualization} from '../entity/Visualization'
import {VisualizationResponse} from '../entity/VisualizationResponse'
import {LatestVisualizationDateResponse} from '../entity/LatestVisualizationDateResponse'
import {FileRoutes} from './file'
import {File} from '../entity/File'
import {ProductVariable} from '../entity/ProductVariable'

export class VisualizationRoutes {

  constructor(conn: Connection, fileController: FileRoutes) {
    this.conn = conn
    this.fileRepo = conn.getRepository<File>('file')
    this.visualizationRepo = conn.getRepository<Visualization>('visualization')
    this.productVariableRepo = conn.getRepository<ProductVariable>('product_variable')
    this.filesQueryBuilder = fileController.filesQueryBuilder
  }

  readonly conn: Connection
  readonly fileRepo: Repository<File>
  readonly visualizationRepo: Repository<Visualization>
  readonly productVariableRepo: Repository<ProductVariable>
  readonly filesQueryBuilder: Function

  putVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    Promise.all([
      this.fileRepo.findOneOrFail(body.sourceFileId),
      this.productVariableRepo.findOneOrFail(body.variableId),
      linkFile(body.fullPath, join(config.publicDir, 'viz'))
    ])
      .then(([file, productVariable, _]) => {
        const viz = new Visualization(req.params[0], file, productVariable)
        return this.visualizationRepo.insert(viz)
          .then(_ => res.sendStatus(201))
          .catch(err => {
            res.sendStatus(500)
            next(err)
          })
      })
      .catch((err: any) => next({ status: 400, errors: err}))
  }

  visualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.visualizationsQueryBuilder(query)
      .getMany()
      .then(result =>
        res.send(result
          .map(file => new VisualizationResponse(file))))
      .catch(err => next({ status: 500, errors: err }))
  }

  visualizationForSourceFile: RequestHandler = async (req: Request, res: Response, next) => {
    const params = req.params
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.visualizations', 'visualizations')
      .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .where('file.uuid = :uuid', params)
    hideTestDataFromNormalUsers(qb, req)
      .getOne()
      .then(file => {
        if (file == undefined) {
          next({status: 404, errors: ['No files match the query'], params})
          return
        }
        res.send(new VisualizationResponse(file))
      })
      .catch(err => next({status: 500, errors: err}))
  }

  latestVisualizationDate: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.visualizationsQueryBuilder(query)
      .getOne()
      .then(result => {
        if (!result) {
          next(next({ status: 404, errors: ['No visualizations were found with the selected query parameters'] }))
          return
        }
        res.send(new LatestVisualizationDateResponse(result))
      })
      .catch(err => next({ status: 500, errors: err }))
  }

  private visualizationsQueryBuilder(query: any): SelectQueryBuilder<File> {
    let qb = this.filesQueryBuilder(query)
      .innerJoinAndSelect('file.visualizations', 'visualizations')
      .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
    if ('variable' in query && query.variable.length) qb = qb.andWhere('product_variable.id IN (:...variable)', query)
    return qb
  }

}
