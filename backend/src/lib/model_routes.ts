import {ModelFile} from '../entity/ModelFile'
import {ModelSite} from '../entity/ModelSite'
import {ModelType} from '../entity/ModelType'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {rowExists} from '.'
import {fetchAll} from '.'
import config from '../config'
import {ReceivedFile} from './metadata2db.js'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.fileServerUrl = config.fileServerUrl
    this.modelFileRepo = this.conn.getRepository(ModelFile)
  }

  private conn: Connection
  readonly fileServerUrl: string
  private modelFileRepo: Repository<ModelFile>

  private augmentFiles = (files: ModelFile[]) => {
    return files.map(entry =>
      ({ ...entry, url: `${this.fileServerUrl}${entry.filename}` }))
  }

  private filesQueryBuilder(query: any) {
    const qb = this.modelFileRepo      
    .createQueryBuilder('file')
    .leftJoinAndSelect('file.site', 'site')
    .leftJoinAndSelect('file.modelType', 'modelType')
    .where('site.id IN (:...location)', query)
    .andWhere('modelType.id IN (:...modelType)', query)
    .andWhere('file.volatile IN (:...volatile)', query)
    if (query.date != undefined) {
      qb.andWhere('file.measurementDate = :date',)
    }
    return qb    
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    this.filesQueryBuilder(req.query)
      .getMany()
      .then(result => {
        res.send(this.augmentFiles(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  sites: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<ModelSite>(this.conn, ModelSite)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  modelTypes: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<ModelType>(this.conn, ModelType)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  allfiles: RequestHandler = async (_: Request, res: Response, next) =>
    this.modelFileRepo.find({ relations: ['site', 'modelType'] })
      .then(result => res.send(this.augmentFiles(result)))
      .catch(err => next({ status: 500, errors: err }))


  putModelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    next({status: 200, "body": req.body, "headers": req.headers})
  }

}

