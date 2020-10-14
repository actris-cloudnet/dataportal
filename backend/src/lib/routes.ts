import { File } from '../entity/File'
import { Site } from '../entity/Site'
import { Product } from '../entity/Product'
import {UploadedMetadata, Status, METADATA_ID_LENGTH} from '../entity/UploadedMetadata'
import { Connection, Repository } from 'typeorm'
import { Request, Response, RequestHandler } from 'express'
import {dateToUTCString, hideTestDataFromNormalUsers, isValidDate, linkFile, rowExists, toArray, tomorrow} from '.'
import { join, basename } from 'path'
import archiver = require('archiver')
import { createReadStream, promises as fsp, constants as fsconst } from 'graceful-fs'
import { fetchAll } from '.'
import config from '../config'
import {ReceivedFile} from './metadata2db.js'
import {Visualization} from '../entity/Visualization'
import {VisualizationResponse} from '../entity/VisualizationResponse'
import {ProductVariable} from '../entity/ProductVariable'
import {LatestVisualizationDateResponse} from '../entity/LatestVisualizationDateResponse'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import {Instrument} from '../entity/Instrument'
import {ReducedMetadataResponse} from '../entity/ReducedMetadataResponse'
import {Collection} from '../entity/Collection'


export class Routes {

  constructor(conn: Connection) {
    this.conn = conn
    this.publicDir = config.publicDir
    this.fileServerUrl = config.fileServerUrl
    this.fileRepo = this.conn.getRepository(File)
    this.siteRepo = this.conn.getRepository(Site)
    this.productRepo = this.conn.getRepository(Product)
    this.visualizationRepo = this.conn.getRepository(Visualization)
    this.productVariableRepo = this.conn.getRepository(ProductVariable)
    this.uploadedMetadataRepo = this.conn.getRepository(UploadedMetadata)
    this.instrumentRepo = this.conn.getRepository(Instrument)
    this.collectionRepo = this.conn.getRepository(Collection)
  }

  readonly conn: Connection
  readonly publicDir: string
  readonly fileServerUrl: string
  private fileRepo: Repository<File>
  private siteRepo: Repository<Site>
  private productRepo: Repository<Product>
  private visualizationRepo: Repository<Visualization>
  private productVariableRepo: Repository<ProductVariable>
  private uploadedMetadataRepo: Repository<UploadedMetadata>
  private instrumentRepo: Repository<Instrument>
  private collectionRepo: Repository<Collection>

  private augmentFiles = (files: File[]) => {
    return files.map(entry =>
      ({ ...entry, url: `${this.fileServerUrl}${entry.filename}` }))
  }

  private filesQueryBuilder(query: any) {
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

  private visualizationsQueryBuilder(query: any) {
    let qb = this.filesQueryBuilder(query)
      .innerJoinAndSelect('file.visualizations', 'visualizations')
      .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
    if ('variable' in query && query.variable.length) qb = qb.andWhere('product_variable.id IN (:...variable)', query)
    return qb
  }

  private allFilesAreReadable = (filepaths: string[]) =>
    Promise.all(filepaths.map(filepath => fsp.access(filepath, fsconst.R_OK)))

  private convertToSearchFiles = (files: File[]) =>
    files.map(file => new SearchFileResponse(file))


  file: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .where('file.uuid = :uuid', req.params)
    hideTestDataFromNormalUsers<File>(qb, req)
      .getMany()
      .then(result => {
        if (result.length == 0) throw new Error()
        res.send(this.augmentFiles(result)[0])
      })
      .catch(_err => next({ status: 404, errors: ['No files match this UUID'] }))
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.filesQueryBuilder(query)
      .getMany()
      .then(result => {
        res.send(this.augmentFiles(result))
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
        res.send(this.convertToSearchFiles(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  site: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder('site')
      .where('site.id = :siteid', req.params)
    hideTestDataFromNormalUsers<Site>(qb, req)
      .getOne()
      .then(result => {
        if (result == undefined) return next({ status: 404, errors: ['No sites match this id'] })
        res.send(result)
      })
      .catch(err => next({ status: 500, errors: err }))
  }

  sites: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder('site')
      .select()
    hideTestDataFromNormalUsers(qb, req)
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  products: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  productVariables: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Product, {relations: ['variables']})
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  instruments: RequestHandler = async (_req: Request, res: Response, next) => {
    fetchAll<Product>(this.conn, Instrument)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  download: RequestHandler = async (req: Request, res: Response, next) => {
    const collectionUuid: string = req.params.collectionUuid
    const collection = await this.collectionRepo.findOne(collectionUuid, {relations: ['files']})
    if (collection === undefined) {
      return next({status: 404, errors: ['No collection matches this UUID.']})
    }
    try {
      const filepaths = collection.files
        .map(file => file.filename)
        .map(filename => join(this.publicDir, filename))
      await this.allFilesAreReadable(filepaths)

      const archive = archiver('zip', { store: true })
      archive.on('warning', console.error)
      archive.on('error', console.error)
      req.on('close', () => archive.abort)

      const receiverFilename = `cloudnet-collection-${new Date().getTime()}.zip`
      res.set('Content-Type', 'application/octet-stream')
      res.set('Content-Disposition', `attachment; filename="${receiverFilename}"`)
      archive.pipe(res)

      let i = 1
      const appendFile = (idx: number) => {
        const fileStream = createReadStream(filepaths[idx])
        archive.append(fileStream, { name: basename(filepaths[idx]) })
        if (idx == (filepaths.length - 1)) archive.finalize()
      }
      archive.on('entry', () => i < filepaths.length ? appendFile(i++) : null)
      appendFile(0)
    } catch (err) {
      res.sendStatus(500)
      next(err)
    }
  }

  putVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    Promise.all([
      this.fileRepo.findOneOrFail(body.sourceFileId),
      this.productVariableRepo.findOneOrFail(body.variableId),
      linkFile(body.fullPath, join(config.publicDir, 'viz'))
    ])
      .then(([file, productVariable, _]) => {
        const viz = new Visualization(req.params.filename, file, productVariable)
        return this.visualizationRepo.insert(viz)
          .then(_ => res.sendStatus(201))
          .catch(err => {
            res.sendStatus(500)
            next(err)
          })
      })
      .catch((err: any) => next({ status: 400, errors: err}))
  }

  getVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.visualizationsQueryBuilder(query)
      .getMany()
      .then(result =>
        res.send(result
          .map(file => new VisualizationResponse(file))))
      .catch(err => next({ status: 500, errors: err }))
  }

  getVisualizationForSourceFile: RequestHandler = async (req: Request, res: Response, next) => {
    const params = req.params
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.visualizations', 'visualizations')
      .leftJoinAndSelect('visualizations.productVariable', 'product_variable')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .where('file.uuid = :uuid', params)
    hideTestDataFromNormalUsers(qb, req)
      .getOne()
      .then(file => {
        if (file == undefined) {
          next({status: 404, errors: ['No files match the query'], params})
          return
        }
        res.send(new VisualizationResponse(file))
      })
      .catch(err => next({status: 500, errors: err}))
  }

  getLatestVisualizationDate: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    this.visualizationsQueryBuilder(query)
      .getOne()
      .then(result => {
        if (!result) {
          next(next({ status: 404, errors: ['No visualizations were found with the selected query parameters'] }))
          return
        }
        res.send(new LatestVisualizationDateResponse(result))
      })
      .catch(err => next({ status: 500, errors: err }))
  }

  allfiles: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(this.augmentFiles(result)))
      .catch(err => next({ status: 500, errors: err }))

  allsearch: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(this.convertToSearchFiles(result)))
      .catch(err => next({ status: 500, errors: err }))

  putMetadataXml: RequestHandler = async (req: Request, res: Response, next) => {
    const isFreeze = (header:any) => {
      const xFreeze = header['x-freeze'] || 'false'
      return xFreeze.toLowerCase() == 'true'
    }
    try {
      const receivedFile = new ReceivedFile(req.body, this.conn, isFreeze(req.headers))

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

  status: RequestHandler = async (_req: Request, res: Response, next) =>
    this.fileRepo.createQueryBuilder('file').leftJoin('file.site', 'site')
      .select('site.id')
      .addSelect('MAX(file.releasedAt)', 'last_update')
      .addSelect('MAX(file.measurementDate)', 'last_measurement')
      .groupBy('site.id')
      .orderBy('last_update', 'DESC')
      .getRawMany()
      .then(result => {
        const pad = (str: string) => str.padEnd(21, ' ')
        let resultTable = result.map(res =>
          `${pad(res.site_id)}${pad(dateToUTCString(res.last_update))}${dateToUTCString(res.last_measurement)}`)
        resultTable.unshift(Object.keys(result[0]).map(pad).join(''))
        return res.send(`
          <html>
          <head>
          <style>body {background:#222;color:#eee}</style>
          <meta http-equiv="refresh" content="10">
          </head>
          <body>
          <pre>Status on ${dateToUTCString(new Date())}</pre>
          <pre>${resultTable.join('\n')}</pre>
          </body>
          </html>
        `)
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })

    uploadMetadata: RequestHandler = async (req: Request, res: Response, next) => {
      const id = req.params.hash
      const body = req.body
      if (!('filename' in body) || !body.filename) {
        next({ status: 422, errors: ['Request is missing filename']})
        return
      }
      if (!('hashSum' in body) || body.hashSum.length != 64) {
        next({ status: 422, errors: ['Request is missing hashSum or hashSum is invalid']})
        return
      }
      if (id != body.hashSum.substr(0, METADATA_ID_LENGTH)) {
        next({ status: 400, errors: [`Invalid ID. ID must consist of the ${METADATA_ID_LENGTH} first characters of hash`]})
        return
      }
      if (!('measurementDate' in body) || !body.measurementDate || !isValidDate(body.measurementDate)) {
        next({ status: 422, errors: ['Request is missing measurementDate or measurementDate is invalid']})
        return
      }
      if (!('instrument' in body) || !body.instrument) {
        next({ status: 422, errors: ['Request is missing instrument']})
        return
      }
      if (!('site' in body) || !body.site) {
        next({ status: 422, errors: ['Request is missing site']})
        return
      }

      const site = await this.siteRepo.findOne(body.site)
      if (site == undefined) return next({ status: 422, errors: [ 'Unknown site']})

      const instrument = await this.instrumentRepo.findOne(body.instrument)
      if (instrument == undefined) return next({ status: 422, errors: [ 'Unknown instrument']})

      // Remove existing metadata if it's status is created
      const existingCreatedMetadata = await this.uploadedMetadataRepo.createQueryBuilder('uploaded_metadata')
        .where('uploaded_metadata.id = :id', { id })
        .andWhere('uploaded_metadata.status = :status', { status: Status.CREATED })
        .getOne()
      if (existingCreatedMetadata != undefined) {
        await this.uploadedMetadataRepo.remove(existingCreatedMetadata)
      }

      const uploadedMetadata = new UploadedMetadata(
        id,
        body.hashSum,
        body.filename,
        body.measurementDate,
        site,
        instrument,
        Status.CREATED)

      return this.uploadedMetadataRepo.insert(uploadedMetadata)
        .then(() => res.sendStatus(201))
        .catch(err => rowExists(err)
          ? res.sendStatus(200)
          : next({ status: 500, errors: err}))
    }

    getMetadata: RequestHandler = async (req: Request, res: Response, next) => {
      if (req.params.hash.length != METADATA_ID_LENGTH)
        return next({ status: 400, errors: [`ID length must be exactly ${METADATA_ID_LENGTH} characters`]})

      this.uploadedMetadataRepo.findOne(req.params.hash, { relations: ['site', 'instrument'] })
        .then(uploadedMetadata => {
          if (uploadedMetadata == undefined) return next({ status: 404, errors: ['No metadata was found with provided id']})
          res.send(uploadedMetadata)
        })
        .catch(err => next({ status: 500, errors: err}))
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

  updateMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    this.uploadedMetadataRepo.update({id: req.params.hash}, {...req.body, ...{updatedAt: new Date() }})
      .then(updatedResults => {
        if (updatedResults.affected == 0) return next({ status: 404, errors: ['No metadata was found with provided id']})
        res.send(updatedResults)
      })
      .catch(err => { next({ status: 500, errors: err}) })
  }

  addCollection: RequestHandler = async (req: Request, res: Response, next) => {
    if (!('files' in req.body) || !req.body.files || !Array.isArray(req.body.files)) {
      next({status: 422, errors: ['Request is missing field "files".']})
      return
    }
    const fileUuids: string[] = req.body.files
    try {
      const files = await this.fileRepo.findByIds(fileUuids)
      if (files.length != fileUuids.length) {
        const existingUuids = files.map(file => file.uuid)
        const missingFiles = fileUuids.filter(uuid => !existingUuids.includes(uuid))
        return next({status: 422, errors: [`Following files do not exist: ${missingFiles}`]})
      }
      const collection = await this.collectionRepo.save(new Collection(files))
      res.send(collection.uuid)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }

  getCollection: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid: string = req.params.uuid
    try {
      const collection = await this.collectionRepo.findOne(uuid, {relations: ['files', 'files.site', 'files.product']})
      if (collection === undefined) return next({status: 404, errors: ['Collection not found']})
      const files = collection.files.map(file => new SearchFileResponse(file))
      const collectionResponse = {...collection, ...{files}}
      res.send(collectionResponse)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }
}

