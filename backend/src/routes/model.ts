import {Model} from '../entity/Model'
import {Upload} from '../entity/Upload'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {fetchAll, augmentFiles} from '../lib'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.uploadRepo = this.conn.getRepository(Upload)}

  private conn: Connection
  private uploadRepo: Repository<Upload>

  private ModelFilesQueryBuilder(query: any) {
    const qb = this.uploadRepo
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.model', 'model')
      .where('site.id IN (:...location)', query)
      .andWhere('model.id IN (:...model)', query)
    if (query.date != undefined) qb.andWhere('file.measurementDate = :date')
    qb.orderBy('file.measurementDate', 'DESC')
    return qb
  }

  modelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    this.ModelFilesQueryBuilder(req.query)
      .getMany()
      .then(result => res.send(augmentFiles(result)))
      .catch(err => next ({ status: 500, errors: err }))
  }

  modelFile: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      const metadata = await this.uploadRepo.findOne(req.params.uuid, {relations: ['site', 'model']})
      if (metadata == undefined || metadata.model == null) {
        next({ status: 404, errors: ['No model file match this UUID']})
      }
      res.send(augmentFiles([metadata])[0])
    } catch (err) {
      next ({ status: 500, errors: err })
    }
  }

  models: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<Model>(this.conn, Model)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
