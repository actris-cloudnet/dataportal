import {Request, RequestHandler, Response} from 'express'
import {Collection} from '../entity/Collection'
import config from '../config'
import {Connection, EntityManager, Repository} from 'typeorm'
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
            await this.removeWorseModelFile(transactionalEntityManager, file)
          }
          await transactionalEntityManager.insert(File, file)
          await transactionalEntityManager.insert(SearchFile, searchFile)
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
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
    if (query.allVersions == undefined) {
      qb.innerJoin(sub_qb =>
        sub_qb
          .from('file', 'file')
          .select('MAX(file.updatedAt)', 'updated_at')
          .groupBy('file.site, file.measurementDate, file.product'),
      'last_version',
      'file.updatedAt = last_version.updated_at'
      )
    }
    qb
      .andWhere('site.id IN (:...site)', query)
      .andWhere('product.id IN (:...product)', query)
      .andWhere('file.measurementDate >= :dateFrom AND file.measurementDate <= :dateTo', query)
      .andWhere('file.volatile IN (:...volatile)', query)
      .andWhere('file.updatedAt < :releasedBefore', query)
      .andWhere('file.legacy IN (:...showLegacy)', query)
      .orderBy('file.measurementDate', 'DESC')
      .addOrderBy('file.updatedAt', 'DESC')
    if ('limit' in query) qb.limit(parseInt(query.limit))
    return qb
  }

  searchFilesQueryBuilder(query: any) {
    const qb = this.searchFileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .andWhere('site.id IN (:...site)', query)
      .andWhere('product.id IN (:...product)', query)
      .andWhere('file.measurementDate >= :dateFrom AND file.measurementDate <= :dateTo', query)
      .andWhere('file.volatile IN (:...volatile)', query)
      .andWhere('file.legacy IN (:...showLegacy)', query)
      .orderBy('file.measurementDate', 'DESC')
    return qb
  }

  private async removeWorseModelFile(transactionalEntityManager: EntityManager, file: any) {
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
    if (bestModelFile && bestModelFile.model.optimumOrder > optimumOrder)
      await transactionalEntityManager.delete(SearchFile, {uuid: bestModelFile.uuid})
  }


}
