import {ModelFile} from '../entity/ModelFile'
import {Site} from '../entity/Site'
import {ModelType} from '../entity/ModelType'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {fetchAll, dateToJSDate, augmentFiles, isValidDate} from '.'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.modelFileRepo = this.conn.getRepository(ModelFile)
    this.modelTypeRepo = this.conn.getRepository(ModelType)
    this.siteRepo = this.conn.getRepository(Site)
  }

  private conn: Connection
  private modelFileRepo: Repository<ModelFile>
  private modelTypeRepo: Repository<ModelType>
  private siteRepo: Repository<Site>

  private ModelFilesQueryBuilder(query: any) {
    const qb = this.modelFileRepo
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.modelType', 'modelType')
      .where('site.id IN (:...location)', query)
      .andWhere('modelType.id IN (:...modelType)', query)
      .andWhere('file.volatile IN (:...volatile)', query)
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
    this.modelFileRepo.findOne(req.params.uuid, {relations: ['site', 'modelType']})
      .then(result => {
        if (!result) next({ status: 404, errors: ['No files match this UUID']})
        res.send(augmentFiles([result])[0])
      })
      .catch(err => next ({ status: 500, errors: err }))
  }

  modelTypes: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<ModelType>(this.conn, ModelType)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  allmodelfiles: RequestHandler = async (_: Request, res: Response, next) => {
    this.modelFileRepo.find({ relations: ['site', 'modelType'] })
      .then(result => res.send(augmentFiles(result)))
      .catch(err => next({ status: 500, errors: err }))
  }

  freezeModelFile: RequestHandler = async (req: Request, res: Response, next) => {
    if (!('volatile' in req.body && req.body.volatile === 'false')) {
      next({ status: 422 , errors: ['Request is missing volatile or volatile is not false'] })
    }
    const modelFile = await this.modelFileRepo.findOne(req.params.uuid)
    if (!modelFile) {
      next({ status: 404, errors: ['No files match this UUID'] })
    }
    this.modelFileRepo.update(req.params.uuid, { volatile: false })
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  postModelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    await this.validateBody(body, next)

    const measurementDate = dateToJSDate(body.year, body.month, body.day)

    const modelFile = new ModelFile(
      measurementDate,
      body.filename,
      body.hashSum,
      body.format,
      body.size,
      body.location,
      body.modelType)

    try {
      // Assuming only one file / date / site / modelType:
      const existingFile = await this.modelFileRepo.findOne({
        measurementDate: measurementDate,
        site: body.location,
        modelType: body.modelType
      })
      if (!existingFile) {
        await this.modelFileRepo.insert(modelFile)
        res.sendStatus(201)
      }
      else if (!existingFile.volatile) {
        next({ status: 403, errors: ['Can not update non-volatile file'] })
      }
      else if (existingFile.checksum == body.hashSum) {
        next({ status: 409, errors: ['File already exists'] })
      }
      else {
        await this.modelFileRepo.update(existingFile.uuid, modelFile)
        res.sendStatus(200)
      }
    }
    catch (err) {
      next({ status: 500, errors: err })
    }

  }


  private validateBody = async (body: any, next: any) => {

    const error = (msg: string) => {next({ status: 422, errors: `${msg} in ${body.filename}` })}

    ['year', 'month', 'day', 'hashSum', 'filename', 'modelType', 'location', 'format', 'size']
      .forEach(key => {
        if (!(key in body)) error(`Missing: ${key}`)
      })

    const datestr = `${body.year}-${body.month}-${body.day}`
    if (!isValidDate(datestr)) error(`Invalid date "${datestr}"`)

    if (await this.modelTypeRepo.findOne(body.modelType) == undefined) error(`Invalid model type "${body.modelType}"`)
    if (await this.siteRepo.findOne(body.location) == undefined) error(`Invalid model site "${body.location}"`)
    if (body.hashSum.length !== 64) error('Invalid hash length')

  }

}
