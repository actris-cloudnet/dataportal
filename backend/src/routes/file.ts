import {Request, RequestHandler, Response} from 'express'
import {Collection} from '../entity/Collection'
import config from '../config'
import {Connection, Repository} from 'typeorm'
import {File} from '../entity/File'
import {convertToSearchFiles, hideTestDataFromNormalUsers, rowExists, sortByMeasurementDateAsc} from '../lib'
import {ReceivedFile} from '../lib/metadata2db'
import {augmentFiles} from '../lib/'

export class FileRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.fileRepo = conn.getRepository<File>('file')
    this.fileServerUrl = config.fileServerUrl
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<File>
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

    this.filesQueryBuilder(query)
      .getMany()
      .then(result => {
        if (result.length == 0) {
          next({ status: 404, errors: ['The search yielded zero results'], params: req.query })
          return
        }
        res.send(convertToSearchFiles(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  putFile: RequestHandler = async (req: Request, res: Response, next) => {
    const s3key = req.params.s3key
    const isFreeze = (header:any) => {
      const xFreeze = header['x-freeze'] || 'false'
      return xFreeze.toLowerCase() == 'true'
    }
    try {
      const receivedFile = new ReceivedFile(req.body, this.conn, isFreeze(req.headers), s3key)

      const existingFile = await this.fileRepo.findOne(receivedFile.getUuid(), { relations: ['site']})
      if (existingFile == undefined) {
        await receivedFile.insertFile()
        return res.sendStatus(201)
      } else {
        if (existingFile.site.isTestSite || existingFile.volatile) {
          await receivedFile.updateFile()
          return res.sendStatus(200)
        }
        return next({
          status: 403,
          errors: ['File exists and cannot be updated since it is freezed and not from a test site']
        })
      }
    } catch (e) {
      if (rowExists(e)) return next({status: 409, errors: e})
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
        res.send(convertToSearchFiles(sortByMeasurementDateAsc(result)))
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
          .select('MAX(file.releasedAt)', 'released_at')
          .groupBy('file.site, file.measurementDate, file.product'),
      'last_version',
      'file.releasedAt = last_version.released_at'
      )
    }
    qb
      .andWhere('site.id IN (:...location)', query)
      .andWhere('product.id IN (:...product)', query)
      .andWhere('file.measurementDate >= :dateFrom AND file.measurementDate <= :dateTo', query)
      .andWhere('file.volatile IN (:...volatile)', query)
      .andWhere('file.releasedAt < :releasedBefore', query)
      .orderBy('file.measurementDate', 'DESC')
      .addOrderBy('file.releasedAt', 'DESC')
    if ('limit' in query) qb.limit(parseInt(query.limit))
    return qb
  }

}
