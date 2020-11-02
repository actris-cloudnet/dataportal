import {Site} from '../entity/Site'
import {Status, Upload} from '../entity/Upload'
import {Connection, Repository} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'
import {
  fetchAll,
  isValidDate,
  rowExists,
  S3_BAD_HASH_ERROR_CODE, toArray,
  tomorrow
} from '../lib'
import {basename} from 'path'
import config from '../config'
import {ReducedMetadataResponse} from '../entity/ReducedMetadataResponse'
import {S3} from 'aws-sdk'
import * as AWSMock from 'mock-aws-s3'
import {PutObjectRequest} from 'aws-sdk/clients/s3'
import validator from 'validator'
import {Instrument} from '../entity/Instrument'


export class UploadRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.uploadedMetadataRepo = this.conn.getRepository(Upload)
    this.instrumentRepo = this.conn.getRepository(Instrument)
    this.siteRepo = this.conn.getRepository(Site)
    if (process.env.NODE_ENV == 'production') {
      this.s3 = new S3(config.s3.connection.rw)
    } else {
      AWSMock.config.basePath = 'buckets/'
      this.s3 = new AWSMock.S3()
      this.s3.createBucket({Bucket: config.s3.buckets.upload})
    }
  }

  readonly conn: Connection
  readonly uploadedMetadataRepo: Repository<Upload>
  readonly instrumentRepo: Repository<Instrument>
  readonly siteRepo: Repository<Site>
  readonly s3: S3

  postMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body

    const checksum = req.body.checksum

    const site = await this.siteRepo.findOne(req.params.site)
    if (site == undefined) return next({ status: 422, error: 'Unknown site'})

    const instrument = await this.instrumentRepo.findOne(body.instrument)
    if (instrument == undefined) return next({ status: 422, error: 'Unknown instrument'})

    // Remove existing metadata if it's status is created
    const existingCreatedMetadata = await this.uploadedMetadataRepo.findOne({checksum: checksum, status: Status.CREATED})
    if (existingCreatedMetadata != undefined) {
      await this.uploadedMetadataRepo.remove(existingCreatedMetadata)
    }

    const uploadedMetadata = new Upload(
      body.checksum,
      basename(body.filename),
      body.measurementDate,
      site,
      instrument,
      Status.CREATED)

    return this.uploadedMetadataRepo.insert(uploadedMetadata)
      .then(() => res.sendStatus(200))
      .catch(err => rowExists(err)
        ? next({ status: 409, error: 'File already exists' })
        : next({ status: 500, error: `Internal server error: ${err.code}`}))
  }

  getMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum
    this.uploadedMetadataRepo.findOne({checksum: checksum}, { relations: ['site', 'instrument'] })
      .then(uploadedMetadata => {
        if (uploadedMetadata == undefined) return next({ status: 404, errors: ['No metadata was found with provided id']})
        res.send(uploadedMetadata)
      })
      .catch(err => next({ status: 500, errors: err}))
  }

  listMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    (await this.metadataQueryBuilder(req.query))
      .getMany()
      .then(uploadedMetadata => res.send(uploadedMetadata))
      .catch(err => {next({status: 500, errors: err})})
  }

  listInstrumentsFromMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    (await this.metadataQueryBuilder(req.query, true))
      .getMany()
      .then(uploadedMetadata =>
        res.send(uploadedMetadata.map(md => new ReducedMetadataResponse(md))))
      .catch(err => {next({status: 500, errors: err})})
  }

  putData: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum
    const site = req.params.site
    try {
      const md = await this.uploadedMetadataRepo.findOne({where: {checksum: checksum, site: {id: site}}, relations: ['site']})
      if (!md) return next({status: 400, error: 'No metadata matches this hash'})
      if (md.status != Status.CREATED) return res.sendStatus(200) // Already uploaded

      const uploadParams: PutObjectRequest = {
        Bucket: config.s3.buckets.upload,
        Key: md.s3key,
        Body: req,
        ContentMD5: Buffer.from(checksum, 'hex').toString('base64')
      }
      try {
        await this.s3.upload(uploadParams).promise()
      } catch (err) {
        // Changes to this block require manual testing
        if (err.code == S3_BAD_HASH_ERROR_CODE) {
          return next({status: 400, error: 'Hash does not match file contents'})
        }
        // End block
        const status = 502
        res.status(status)
        res.send({status: status, error: `Upstream server error: ${err.code}`})
        next({status: status, error: err})
      }
      await this.uploadedMetadataRepo.update({checksum: checksum}, {status: Status.UPLOADED, updatedAt: new Date() })
      res.sendStatus(201)
    } catch (err) {
      return next({status: 500, error: err})
    }
  }

  private async metadataQueryBuilder(query: any, onlyDistinctInstruments= false) {
    const augmentedQuery: any = {
      site: query.site || (await fetchAll<Site>(this.conn, Site)).map(site => site.id),
      status: query.status || [Status.UPLOADED, Status.CREATED, Status.PROCESSED],
      dateFrom: query.dateFrom || '1970-01-01',
      dateTo: query.dateTo || tomorrow()
    }
    augmentedQuery.site = toArray(augmentedQuery.site)
    augmentedQuery.status = toArray(augmentedQuery.status)

    const qb = this.uploadedMetadataRepo.createQueryBuilder('um')
    qb.leftJoinAndSelect('um.site', 'site')
      .leftJoinAndSelect('um.instrument', 'instrument')
    if (onlyDistinctInstruments)  qb.distinctOn(['instrument.id'])
    qb.where('um.measurementDate >= :dateFrom AND um.measurementDate <= :dateTo', augmentedQuery)
      .andWhere('site.id IN (:...site)', augmentedQuery)
      .andWhere('um.status IN (:...status)', augmentedQuery)
    if (!onlyDistinctInstruments) qb.orderBy('um.measurementDate', 'ASC')

    return Promise.resolve(qb)
  }

  validateMetadata: RequestHandler = async (req, res, next) => {
    const body = req.body

    if (!('filename' in body) || !body.filename) {
      next({ status: 422, error: 'Request is missing filename'})
      return
    }
    if (!('checksum' in body) || !validator.isMD5(body.checksum)) {
      next({ status: 422, error: 'Request is missing checksum or checksum is invalid'})
      return
    }
    if (!('measurementDate' in body) || !body.measurementDate || !isValidDate(body.measurementDate)) {
      next({ status: 422, error: 'Request is missing measurementDate or measurementDate is invalid'})
      return
    }
    if (!('instrument' in body) || !body.instrument) {
      next({ status: 422, error: 'Request is missing instrument'})
      return
    }

    return next()
  }
}
