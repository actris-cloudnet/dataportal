import {Site} from '../entity/Site'
import {InstrumentUpload, MiscUpload, ModelUpload, Status, Upload} from '../entity/Upload'
import {Connection, Repository} from 'typeorm'
import {NextFunction, Request, RequestHandler, Response} from 'express'
import {
  dateforsize,
  fetchAll,
  getS3pathForUpload,
  isValidDate,
  ssAuthString, streamHandler,
  toArray,
  tomorrow
} from '../lib'
import {basename} from 'path'
import {ReducedMetadataResponse} from '../entity/ReducedMetadataResponse'
import validator from 'validator'
import {Instrument} from '../entity/Instrument'
import {Model} from '../entity/Model'
import {ModelFile, RegularFile} from '../entity/File'
import * as http from 'http'
import ReadableStream = NodeJS.ReadableStream
import env from '../lib/env'


export class UploadRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.instrumentUploadRepo = this.conn.getRepository(InstrumentUpload)
    this.miscUploadRepo = this.conn.getRepository(MiscUpload)
    this.modelUploadRepo = this.conn.getRepository(ModelUpload)
    this.instrumentRepo = this.conn.getRepository(Instrument)
    this.modelRepo = this.conn.getRepository(Model)
    this.siteRepo = this.conn.getRepository(Site)
    this.modelFileRepo = this.conn.getRepository(ModelFile)
    this.regularFileRepo = this.conn.getRepository(RegularFile)
  }

  readonly conn: Connection
  readonly instrumentUploadRepo: Repository<InstrumentUpload>
  readonly miscUploadRepo: Repository<MiscUpload>
  readonly modelUploadRepo: Repository<ModelUpload>
  readonly instrumentRepo: Repository<Instrument>
  readonly siteRepo: Repository<Site>
  readonly modelRepo: Repository<Model>
  readonly modelFileRepo: Repository<ModelFile>
  readonly regularFileRepo: Repository<RegularFile>


  postMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    const filename = basename(body.filename)
    const isModelSubmission = 'model' in body
    const isInstrumentSubmission = 'instrument' in body
    const status200Message = ('allowUpdate' in body) ? 'Warning: Ignoring obsolete allowUpdate property' : 'OK'

    let instrument, model
    let uploadRepo: Repository<InstrumentUpload | ModelUpload>
    let productRepo: Repository<RegularFile | ModelFile>

    try {
      const site = await this.siteRepo.findOne(req.params.site)
      if (site == undefined) {
        return next({status: 422, errors: 'Unknown site'})
      }

      if (isModelSubmission && isInstrumentSubmission) return next({
        status: 422,
        errors: 'Both "instrument" and "model" fields may not be specified'
      })

      if (isInstrumentSubmission) {
        instrument = await this.instrumentRepo.findOne(body.instrument)
        if (instrument == undefined) return next({status: 422, errors: 'Unknown instrument'})
        uploadRepo = this.instrumentUploadRepo
        if (this.isMiscUpload(instrument)) uploadRepo = this.miscUploadRepo
        productRepo = this.regularFileRepo
      } else if (isModelSubmission) {
        model = await this.modelRepo.findOne(body.model)
        if (model == undefined) return next({status: 422, errors: 'Unknown model'})
        uploadRepo = this.modelUploadRepo
        productRepo = this.modelFileRepo
      } else return next({
        status: 422,
        errors: 'Metadata must have either "instrument" or "model" field'
      })

      // Remove existing metadata if its status is created
      const existingCreatedMetadata = await uploadRepo.findOne({
        checksum: body.checksum,
        status: Status.CREATED
      })
      if (existingCreatedMetadata != undefined) {
        await uploadRepo.remove(existingCreatedMetadata)
      }

      const existingUploadedMetadata = await uploadRepo.findOne({checksum: body.checksum})
      if (existingUploadedMetadata != undefined) {
        return next({status: 409, errors: 'File already uploaded'})
      }

      if (isModelSubmission) {
        const isExistingFreezedProduct = await this.isFreezedProduct(body, productRepo)
        if (isExistingFreezedProduct) {
          return next({status: 409, errors: 'Freezed model file exists'})
        }
      }

      const params = {site: site, measurementDate: body.measurementDate, filename: filename}
      const payload = isModelSubmission ? {...params, model: body.model} : {...params, instrument: body.instrument}
      const existingMetadata = await uploadRepo.findOne(payload)
      if (existingMetadata != undefined) {
        await uploadRepo.update(existingMetadata.uuid, {
          checksum: body.checksum,
          updatedAt: new Date(),
          status: Status.CREATED
        })
        return res.send(status200Message)
      }

      let uploadedMetadata: InstrumentUpload | ModelUpload
      if (isInstrumentSubmission) {
        if (this.isMiscUpload(instrument)) {
          uploadedMetadata = new MiscUpload(
            body.checksum,
            filename,
            body.measurementDate,
            site,
            Status.CREATED,
            instrument as Instrument)

        } else {
          uploadedMetadata = new InstrumentUpload(
            body.checksum,
            filename,
            body.measurementDate,
            site,
            Status.CREATED,
            instrument as Instrument)
        }
      } else {
        uploadedMetadata = new ModelUpload(
          body.checksum,
          filename,
          body.measurementDate,
          site,
          Status.CREATED,
          model as Model)
      }

      await uploadRepo.insert(uploadedMetadata)
      return res.send(status200Message)
    } catch (err) {
      return next({status: 500, errors: `Internal server error: ${err.code}`})
    }
  }

  private async isFreezedProduct(body: any, productRepo: Repository<RegularFile | ModelFile>): Promise<boolean> {
    let payload: any = {site: body.site, measurementDate: body.measurementDate, volatile: false}
    if ('model' in body) {
      payload['model'] = body.model
    } else {
      const instrument = await this.instrumentRepo.findOneOrFail(body.instrument)
      payload['product'] = instrument.type
    }
    const existingFreezedProduct = await productRepo.findOne(payload)
    return existingFreezedProduct != undefined
  }

  updateMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const partialUpload = req.body
    if (!partialUpload.uuid) return next({status: 422, errors: 'Request body is missing uuid'})
    try {
      const upload = await this.findAnyUpload((repo, model) =>
        repo.findOne({uuid: partialUpload.uuid}, { relations: ['site', (model ? 'model' : 'instrument')] }))
      if (!upload) return next({status: 422, errors: 'No file matches the provided uuid'})
      await this.findRepoForUpload(upload).update({uuid: partialUpload.uuid}, partialUpload)
      res.sendStatus(200)
    } catch (err) {
      return next({status: 500, errors: `Internal server error: ${err.code}`})
    }
  }

  metadata: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum
    this.findAnyUpload((repo, model) =>
      repo.findOne({checksum: checksum}, { relations: ['site', (model ? 'model' : 'instrument')] }))
      .then(upload => {
        if (upload == undefined) return next({ status: 404, errors: 'No metadata was found with provided id'})
        res.send(this.augmentUploadResponse(true)(upload))
      })
      .catch(err => next({ status: 500, errors: `Internal server error: ${err.code}`}))
  }

  listMetadata = (includeS3path: boolean) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const isModel = req.path.includes('model')
      const repo = isModel ? this.modelUploadRepo : this.instrumentUploadRepo
      this.metadataStream(repo, req.query, false, isModel)
        .then(uploadedMetadata => {
          streamHandler(uploadedMetadata, res, 'um', this.augmentUploadResponse(includeS3path))
        })
        .catch(err => {
          next({status: 500, errors: `Internal server error: ${err}`})
        })
    }
  }

  listInstrumentsFromMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    (this.metadataMany(this.instrumentUploadRepo, req.query, true) as Promise<InstrumentUpload[]>)
      .then(uploadedMetadata =>
        res.send(uploadedMetadata.map(md => new ReducedMetadataResponse(md))))
      .catch(err => {next({status: 500, errors: err})})
  }

  putData: RequestHandler = async (req: Request, res: Response, next) => {
    const checksum = req.params.checksum
    const site = req.params.site
    try {
      const upload = await this.findAnyUpload((repo, model) =>
        repo.findOne({where: {checksum: checksum, site: {id: site}}, relations: ['site', (model ? 'model' : 'instrument')]}))
      if (!upload) return next({status: 400, errors: 'No metadata matches this hash'})
      if (upload.status != Status.CREATED) return res.sendStatus(200) // Already uploaded

      const {status, body} = await this.makeRequest(getS3pathForUpload(upload), checksum, req)

      await this.findRepoForUpload(upload).update({checksum: checksum},
        {status: Status.UPLOADED, updatedAt: new Date(), size: body.size}
      )
      res.sendStatus(status)
    } catch (err) {
      if (err.status == 400 && err.errors == 'Checksum does not match file contents')
        return next(err) // Client error
      if (err.errors) // Our error
        return next({status: 500, errors: `Internal server error: ${err.errors}`})
      return next({status: 500, errors: `Internal server error: ${err.code}`}) // Unknown error
    }
  }

  private async makeRequest(s3path: string, checksum: string, inputStream: ReadableStream):
    Promise<{status: number, body: any}> {

    let headers = {
      'Authorization': ssAuthString(),
      'Content-MD5': Buffer.from(checksum, 'hex').toString('base64')
    }

    const requestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: s3path,
      headers,
      method: 'PUT'
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

  private async metadataQueryBuilder(
    repo: Repository<InstrumentUpload|ModelUpload>,
    query: any,
    onlyDistinctInstruments = false,
    model = false) {
    const augmentedQuery: any = {
      site: query.site || (await fetchAll<Site>(this.conn, Site)).map(site => site.id),
      status: query.status || [Status.UPLOADED, Status.CREATED, Status.PROCESSED, Status.INVALID],
      dateFrom: query.dateFrom || '1970-01-01',
      dateTo: query.dateTo || tomorrow(),
      instrument: model ? undefined : query.instrument,
      model: model ? query.model : undefined,
      updatedAtFrom: query.updatedAtFrom ? new Date(query.updatedAtFrom) : '1970-01-01T00:00:00.000Z',
      updatedAtTo: query.updatedAtTo ? new Date(query.updatedAtTo) : tomorrow()
    }

    const fieldsToArray = ['site', 'status', 'instrument', 'model']
    fieldsToArray.forEach(element => augmentedQuery[element] = toArray(augmentedQuery[element]))

    const qb = repo.createQueryBuilder('um')
    qb.leftJoinAndSelect('um.site', 'site')
    if (!model) {
      qb.leftJoinAndSelect('um.instrument', 'instrument')
      if (onlyDistinctInstruments) qb.distinctOn(['instrument.id'])
    } else {
      qb.leftJoinAndSelect('um.model', 'model')
    }
    qb.where('um.measurementDate >= :dateFrom AND um.measurementDate <= :dateTo', augmentedQuery)
      .andWhere('um.updatedAt >= :updatedAtFrom AND um.updatedAt <= :updatedAtTo', augmentedQuery)
      .andWhere('site.id IN (:...site)', augmentedQuery)
      .andWhere('um.status IN (:...status)', augmentedQuery)
    if (query.instrument) qb.andWhere('instrument.id IN (:...instrument)', augmentedQuery)
    if (query.model) qb.andWhere('model.id IN (:...model)', augmentedQuery)

    if (!onlyDistinctInstruments) qb.addOrderBy('size', 'DESC')

    return qb
  }

  private async metadataStream(repo: Repository<InstrumentUpload|ModelUpload>, query: any,
    onlyDistinctInstruments = false, model = false) {
    const qb = await this.metadataQueryBuilder(repo, query, onlyDistinctInstruments, model)
    return qb.stream()
  }

  private async metadataMany(repo: Repository<InstrumentUpload|ModelUpload>, query: any,
    onlyDistinctInstruments = false, model = false) {
    const qb = await this.metadataQueryBuilder(repo, query, onlyDistinctInstruments, model)
    return qb.getMany()
  }


  private getDownloadPathForUpload = (file: Upload) =>
    `raw/${file.uuid}/${file.filename}`

  private augmentUploadResponse = (includeS3Path: boolean) =>
    (upload: InstrumentUpload | ModelUpload) =>
      ({...upload, ...{
        downloadUrl: `${env.DP_BACKEND_URL}/download/${this.getDownloadPathForUpload(upload)}`,
        s3path: includeS3Path ? getS3pathForUpload(upload) : undefined
      }})


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

  findAnyUpload(searchFunc: (arg0: Repository<ModelUpload|InstrumentUpload|MiscUpload>, arg1?: boolean) =>
    Promise<ModelUpload|InstrumentUpload|MiscUpload|undefined>):
    Promise<ModelUpload|InstrumentUpload|MiscUpload|undefined> {
    return Promise.all([
      searchFunc(this.instrumentUploadRepo, false),
      searchFunc(this.modelUploadRepo, true),
      searchFunc(this.miscUploadRepo, false)
    ])
      .then(([upload, modelUpload, miscUpload]) => upload || modelUpload || miscUpload)
  }

  dateforsize: RequestHandler = async (req, res, next) => {
    const isModel = 'model' in req.query
    return dateforsize(isModel ? this.modelUploadRepo : this.instrumentUploadRepo, isModel ? 'model_upload' : 'instrument_upload', req, res, next)
  }

  findRepoForUpload(upload: InstrumentUpload | ModelUpload | MiscUpload) {
    if ('instrument' in upload) {
      if (this.isMiscUpload(upload.instrument)) return this.miscUploadRepo
      return this.instrumentUploadRepo
    }
    return this.modelUploadRepo
  }

  isMiscUpload(instrument: Instrument | undefined) {
    if (!instrument) return false
    return instrument.auxiliary
  }

}
