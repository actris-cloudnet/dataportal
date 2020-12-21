import {Request, RequestHandler, Response} from 'express'
import {Collection} from '../entity/Collection'
import config from '../config'
import {Connection, EntityManager, Repository, SelectQueryBuilder} from 'typeorm'
import {File, isFile} from '../entity/File'
import {
  checkFileExists,
  convertToSearchResponse,
  getBucketForFile,
  hideTestDataFromNormalUsers,
  sortByMeasurementDateAsc
} from '../lib'
import {augmentFiles} from '../lib/'
import {SearchFile} from '../entity/SearchFile'
import {Model} from '../entity/Model'

export class FileRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.fileRepo = conn.getRepository<File>('file')
    this.searchFileRepo = conn.getRepository<SearchFile>('search_file')
    this.fileServerUrl = config.downloadBaseUrl
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<File>
  readonly searchFileRepo: Repository<SearchFile>
  readonly fileServerUrl: string

  file: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .leftJoinAndSelect('file.model', 'model')
      .where('file.uuid = :uuid', req.params)
    hideTestDataFromNormalUsers<File>(qb, req)
      .getMany()
      .then(result => {
        if (result.length == 0) throw new Error()
        res.send(augmentFiles(result)[0])
      })
      .catch(_err => next({ status: 404, errors: ['No files match this UUID'] }))
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.filesQueryBuilder(query)
      .getMany()
      .then(result => {
        res.send(augmentFiles(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  search: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query

    this.searchFilesQueryBuilder(query)
      .getMany()
      .then(result => {
        if (result.length == 0) {
          next({ status: 404, errors: ['The search yielded zero results'], params: req.query })
          return
        }
        res.send(convertToSearchResponse(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  putFile: RequestHandler = async (req: Request, res: Response, next) => {
    const file = req.body
    file.s3key = req.params[0]
    file.updatedAt = new Date()
    if (!isFile(file)) return next({status: 422, errors: ['Request body is missing fields or has invalid values in them']})

    try {
      const sourceFileIds = req.body.sourceFileIds || []
      await Promise.all(sourceFileIds.map((uuid: string) => this.fileRepo.findOneOrFail(uuid)))
    } catch (e) {
      return next({status: 422, errors: ['One or more of the specified source files were not found']})
    }

    try {
      await checkFileExists(getBucketForFile(file), file.s3key)
    } catch (e) {
      console.error(e)
      return next({status: 400, errors: ['The specified file was not found in storage service']})
    }

    try {
      const existingFile = await this.fileRepo.findOne({s3key: file.s3key}, { relations: ['site']})
      const searchFile = new SearchFile(file)
      if (existingFile == undefined) { // New file
        file.createdAt = file.updatedAt
        await this.conn.transaction(async transactionalEntityManager => {
          if (file.product == 'model') {
            await this.updateModelSearchFile(transactionalEntityManager, file, searchFile)
          } else {
            await transactionalEntityManager.insert(SearchFile, searchFile)
          }
          await transactionalEntityManager.insert(File, file)
        })
        res.sendStatus(201)
      } else if (existingFile.site.isTestSite || existingFile.volatile) { // Replace existing
        file.createdAt = existingFile.createdAt
        await this.conn.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.update(File, {uuid: file.uuid}, file)
          await transactionalEntityManager.update(SearchFile, {uuid: file.uuid}, searchFile)
        })
        res.sendStatus(200)
      } else if (existingFile.uuid != file.uuid) { // New version
        await this.conn.transaction(async transactionalEntityManager => {
          file.createdAt = file.updatedAt
          await transactionalEntityManager.insert(File, file)
          await transactionalEntityManager.delete(SearchFile, {uuid: existingFile.uuid})
          await transactionalEntityManager.insert(SearchFile, searchFile)
        })
        res.sendStatus(200)
      } else {
        next({
          status: 403,
          errors: ['File exists and cannot be updated since it is freezed and not from a test site']
        })
      }
    } catch (e) {
      next({status: 500, errors: e})
    }
  }

  postFile: RequestHandler = async (req: Request, res: Response, next) => {
    const partialFile = req.body
    if (!partialFile.uuid) return next({status: 422, errors: ['Request body is missing uuid']})
    try {
      const updateResult = await this.fileRepo.update({uuid: partialFile.uuid}, partialFile)
      if (updateResult.affected == 0) return next({status: 422, errors: ['No file matches the provided uuid']})
      delete partialFile.pid // No PID in SearchFile
      delete partialFile.checksum // No checksum in SearchFile
      delete partialFile.version // No version in SearchFile
      await this.searchFileRepo.update({uuid: partialFile.uuid}, partialFile)
      res.sendStatus(200)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }

  allfiles: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(augmentFiles(sortByMeasurementDateAsc(result))))
      .catch(err => next({ status: 500, errors: err }))

  allsearch: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => {
        res.send(convertToSearchResponse(sortByMeasurementDateAsc(result)))
      })
      .catch(err => next({ status: 500, errors: err }))

  filesQueryBuilder(query: any) {
    let qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .leftJoinAndSelect('file.model', 'model')

    // Where clauses
    qb = addCommonFilters(qb, query)
    if (query.releasedBefore) qb.andWhere('file.updatedAt < :releasedBefore', query)

    // allVersions, allModels and model flags
    if (query.allVersions == undefined && query.model == undefined && query.allModels == undefined) {
      qb.innerJoin(sub_qb => // Default functionality
        sub_qb
          .from('search_file', 'searchfile'),
      'best_version',
      'file.uuid = best_version.uuid')
    }
    else if (query.allVersions != undefined && query.allModels == undefined) {
      qb.innerJoin(sub_qb =>
        sub_qb
          .from('file', 'file')
          .leftJoin('file.model', 'model')
          .select('MIN(model.optimumOrder)', 'optimum_order')
          .groupBy('file.s3key'),
      'best_model',
      'model.optimumOrder = best_model.optimum_order OR model IS NULL')
    }
    else if (query.allModels != undefined && query.allVersions == undefined) {
      qb.innerJoin(sub_qb =>
        sub_qb
          .from('file', 'file')
          .select('MAX(file.updatedAt)', 'updated_at')
          .groupBy('file.s3key'),
      'last_version',
      'file.updatedAt =  last_version.updated_at'
      )
    }
    else if (query.model) qb.andWhere('model.id IN (:...model)', query)

    // Ordering
    qb.orderBy('file.measurementDate', 'DESC')
      .addOrderBy('model.optimumOrder', 'ASC')
      .addOrderBy('file.updatedAt', 'DESC')

    // Limit
    if ('limit' in query) qb.limit(parseInt(query.limit))

    return qb
  }

  searchFilesQueryBuilder(query: any) {
    let qb = this.searchFileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
    qb = addCommonFilters(qb, query)
    qb.orderBy('file.measurementDate', 'DESC')
    return qb
  }

  private async updateModelSearchFile(transactionalEntityManager: EntityManager, file: any, searchFile: SearchFile) {
    const {optimumOrder} = await transactionalEntityManager.findOneOrFail(Model, {id: file.model})
    const [bestModelFile] = await transactionalEntityManager.createQueryBuilder(File, 'file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .leftJoinAndSelect('file.model', 'model')
      .andWhere('site.id = :site', file)
      .andWhere('product.id = :product', file)
      .andWhere('file.measurementDate = :measurementDate', file)
      .orderBy('model.optimumOrder', 'ASC')
      .getMany()
    if (!bestModelFile) return transactionalEntityManager.insert(SearchFile, searchFile)
    if (bestModelFile.model.optimumOrder > optimumOrder) { // Received model is better than existing
      await transactionalEntityManager.delete(SearchFile, {uuid: bestModelFile.uuid})
      await transactionalEntityManager.insert(SearchFile, searchFile)
    }
  }

}

function addCommonFilters<T>(qb: SelectQueryBuilder<T>, query: any) {
  qb.andWhere('site.id IN (:...site)', query)
  if (query.product) qb.andWhere('product.id IN (:...product)', query)
  if (query.dateFrom) qb.andWhere('file.measurementDate >= :dateFrom', query)
  if (query.dateTo) qb.andWhere('file.measurementDate <= :dateTo', query)
  if (query.date) qb.andWhere('file.measurementDate = :date', query)
  if (query.volatile) qb.andWhere('file.volatile IN (:...volatile)', query)
  if (query.legacy) qb.andWhere('file.legacy IN (:...legacy)', query)
  return qb as SelectQueryBuilder<T>
}
