import {Site} from '../entity/Site'
import {Status, Upload} from '../entity/Upload'
import {Connection, Repository} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'
import {
  fetchAll,
  isValidDate,
  rowExists,
  toArray,
  tomorrow,
  dateNDaysAgo
} from '../lib'
import {basename} from 'path'
import config from '../config'
import {ReducedMetadataResponse} from '../entity/ReducedMetadataResponse'
import validator from 'validator'
import {Instrument} from '../entity/Instrument'
import { Model } from '../entity/Model'
import * as http from 'http'
import ReadableStream = NodeJS.ReadableStream


export class UploadRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.uploadedMetadataRepo = this.conn.getRepository(Upload)
    this.instrumentRepo = this.conn.getRepository(Instrument)
    this.modelRepo = this.conn.getRepository(Model)
    this.siteRepo = this.conn.getRepository(Site)
  }

  readonly conn: Connection
  readonly uploadedMetadataRepo: Repository<Upload>
  readonly instrumentRepo: Repository<Instrument>
  readonly siteRepo: Repository<Site>
  readonly modelRepo: Repository<Model>

  postMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    const filename = basename(body.filename)
    let instrument, model

    const site = await this.siteRepo.findOne(req.params.site)
    if (site == undefined) {
      return next({ status: 422, errors: 'Unknown site'})
    }

    if ('instrument' in body) {
      instrument = await this.instrumentRepo.findOne(body.instrument)
      if (instrument == undefined) return next({ status: 422, errors: 'Unknown instrument'})
    }

    if ('model' in body) {
      model = await this.modelRepo.findOne(body.model)
      if (model == undefined) return next({ status: 422, errors: 'Unknown model'})
    }

    // Remove existing metadata if its status is created
    const existingCreatedMetadata = await this.uploadedMetadataRepo.findOne({checksum: body.checksum, status: Status.CREATED})
    if (existingCreatedMetadata != undefined) {
      await this.uploadedMetadataRepo.remove(existingCreatedMetadata)
    }

    const allowUpdate = ('allowUpdate' in body && body.allowUpdate.toString().toLowerCase() === 'true')

    // With allowUpdate flag, keep existing uuid to avoid duplicate files
    if (allowUpdate) {
      try {
        const existingMetadata = await this.uploadedMetadataRepo.findOne({filename: filename, allowUpdate: true})
        if (existingMetadata != undefined) {
          if (existingMetadata.updatedAt < dateNDaysAgo(config.allowUpdateLimitDays)) {
            next({ status: 409, errors: 'File too old to be updated' })
          }
          await this.uploadedMetadataRepo.update(existingMetadata.uuid, {
            checksum: body.checksum,
            updatedAt: new Date(),
            status: Status.CREATED
          })
          return res.sendStatus(200)
        }
      } catch (err) {
        return next({ status: 500, errors: err })
      }
    }

    const uploadedMetadata = new Upload(
      body.checksum,
      filename,
      body.measurementDate,
      site,
      allowUpdate,
      Status.CREATED,
      instrument,
      model)

    return this.uploadedMetadataRepo.insert(uploadedMetadata)
      .then(() => res.sendStatus(200))
      .catch(err => rowExists(err)
        ? next({ status: 409, errors: 'File already exists' })
        : next({ status: 500, errors: `Internal server error: ${err.code}`}))
  }

  metadata: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum
    this.uploadedMetadataRepo.findOne({checksum: checksum}, { relations: ['site', 'instrument', 'model'] })
      .then(uploadedMetadata => {
        if (uploadedMetadata == undefined) return next({ status: 404, errors: 'No metadata was found with provided id'})
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
      if (!md) return next({status: 400, errors: 'No metadata matches this hash'})
      if (md.status != Status.CREATED) return res.sendStatus(200) // Already uploaded

      const {status, body} = await this.makeRequest('PUT', md.s3key, checksum, req)

      await this.uploadedMetadataRepo.update({checksum: checksum},
        {status: Status.UPLOADED, updatedAt: new Date(), size: body.size}
      )
      res.sendStatus(status)
    } catch (err) {
      if (err.status == 400 && err.errors == 'Checksum does not match file contents')
        return next(err) // Client error
      if (err.errors) // Our error
        return next({status: 500, errors: `Internal server error: ${err.errors}`})
      return next({status: 500, errors: err}) // Unknown error
    }
  }

  private async makeRequest(method: string, key: string, checksum: string | null, inputStream: ReadableStream):
    Promise<{status: number, body: any}> {

    let headers = {
      'Authorization': 'Basic ' + // eslint-disable-line prefer-template
      Buffer.from(`${config.storageService.user}:${config.storageService.password}`).toString('base64'),
    }
    if (checksum)
      headers = {...headers, ...{'Content-MD5': Buffer.from(checksum, 'hex').toString('base64')}}

    const requestOptions = {
      host: config.storageService.host,
      port: config.storageService.port,
      path: `/cloudnet-upload/${key}`,
      headers,
      method
    }

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions,  response => {
        let responseStr = ''
        response.on('data', chunk => responseStr += chunk)
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 300)
            return reject({status: response.statusCode, errors: responseStr})
          const responseJson = JSON.parse(responseStr)
          resolve({status: response.statusCode as number, body: responseJson})
        })
      })
      req.on('error', err => reject({status: 500, errors: err}))
      inputStream.pipe(req, {end: true})
    })
  }

  private async metadataQueryBuilder(query: any, onlyDistinctInstruments = false) {
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
      .leftJoinAndSelect('um.model', 'model')
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
      next({ status: 422, errors: 'Request is missing filename'})
      return
    }
    if (!('checksum' in body) || !validator.isMD5(body.checksum)) {
      next({ status: 422, errors: 'Request is missing checksum or checksum is invalid'})
      return
    }
    if (!('measurementDate' in body) || !body.measurementDate || !isValidDate(body.measurementDate)) {
      next({ status: 422, errors: 'Request is missing measurementDate or measurementDate is invalid'})
      return
    }

    if (req.path.includes('model')) {
      if (!('model' in body && body.model)) return next({ status: 422, errors: 'Request is missing model'})
    } else {
      if (!('instrument' in body && body.instrument)) return next({ status: 422, errors: 'Request is missing instrument'})
    }
    return next()
  }
}
