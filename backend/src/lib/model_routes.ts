import {ModelFile} from '../entity/ModelFile'
import {ModelSite} from '../entity/ModelSite'
import {ModelType} from '../entity/ModelType'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {fetchAll, dateToJSDate} from '.'
import config from '../config'


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
    const body = req.body
    const modelFile = new ModelFile(
      body.file_uuid,
      body.year,
      body.month,
      body.day,
      body.filename,
      body.hashSum,
      body.format,
      body.size,
      body.site,
      body.modelType)
    try {
      const date = dateToJSDate(body.year, body.month, body.day)
      const existingFile = await this.modelFileRepo.findOne({
        measurementDate: date,
        site: body.site,
        modelType: body.modelType
      })
      if (existingFile == undefined) {
        await this.modelFileRepo.insert(modelFile)
        return res.sendStatus(201)
      } else {
        if (existingFile.volatile) {
          await this.modelFileRepo.update({uuid: existingFile.uuid}, {...modelFile, ...{releasedAt: new Date() }
          })
          return res.sendStatus(200)
        } else {
          return next({
            status: 403,
            errors: 'Existing file can not be updated because it is non-volatile'
          })
        }
      }
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }
}


