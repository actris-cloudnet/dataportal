import { File } from '../entity/File'
import { Site } from '../entity/Site'
import { Product } from '../entity/Product'
import { UploadedMetadata, Status } from '../entity/UploadedMetadata'
import { SelectQueryBuilder, Connection, Repository } from 'typeorm'
import { Request, Response, RequestHandler } from 'express'
import {dateToUTCString, isValidDate, linkFile, rowExists, toArray, tomorrow} from '.'
import { join, basename } from 'path'
import archiver = require('archiver')
import { createReadStream, promises as fsp, constants as fsconst } from 'graceful-fs'
import { fetchAll } from '.'
import config from '../config'
import { putRecord, freezeRecord } from '../metadata2db.js'
import {Visualization} from '../entity/Visualization'
import {VisualizationResponse} from '../entity/VisualizationResponse'
import {ProductVariable} from '../entity/ProductVariable'
import {LatestVisualizationDateResponse} from '../entity/LatestVisualizationDateResponse'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import {Instrument} from '../entity/Instrument'


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
  }

  private conn: Connection
  private publicDir: string
  readonly fileServerUrl: string
  private fileRepo: Repository<File>
  private siteRepo: Repository<Site>
  private productRepo: Repository<Product>
  private visualizationRepo: Repository<Visualization>
  private productVariableRepo: Repository<ProductVariable>
  private uploadedMetadataRepo: Repository<UploadedMetadata>
  private instrumentRepo: Repository<Instrument>

  private hideTestDataFromNormalUsers = <T>(dbQuery: SelectQueryBuilder<T>, req: Request): SelectQueryBuilder<T> =>
    req.query.developer !== undefined ? dbQuery : dbQuery.andWhere('not site.isTestSite')

  private augmentFiles = (files: File[]) => {
    return files.map(entry =>
      ({ ...entry, url: `${this.fileServerUrl}${entry.filename}` }))
  }

  private filesQueryBuilder = (query: any) =>
    this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .where('site.id IN (:...location)', query)
      .andWhere('product.id IN (:...product)', query)
      .andWhere('file.measurementDate >= :dateFrom AND file.measurementDate <= :dateTo', query)
      .andWhere('file.volatile IN (:...volatile)', query)
      .andWhere('file.releasedAt < :releasedBefore', query)
      .orderBy('file.measurementDate', 'DESC')

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
    this.hideTestDataFromNormalUsers<File>(qb, req)
      .getMany()
      .then(result => {
        if (result.length == 0) throw new Error()
        res.send(this.augmentFiles(result)[0])
      })
      .catch(_err => next({ status: 404, errors: ['No files match this UUID'] }))
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query


    const qb = this.filesQueryBuilder(query)
    this.hideTestDataFromNormalUsers(qb, req)
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

    const qb = this.filesQueryBuilder(query)
    this.hideTestDataFromNormalUsers(qb, req)
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

  sites: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder('site')
      .select()
    this.hideTestDataFromNormalUsers(qb, req)
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
    const qb = this.filesQueryBuilder(req.query)
    this.hideTestDataFromNormalUsers(qb, req)
      .select('file.filename')
      .getMany()
      .then(async result => {
        if (result.length == 0) {
          next({ status: 400, errors: ['No files match the query'], params: req.query })
          return
        }
        const filepaths = result
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
      })
      .catch(err => {
        res.sendStatus(500)
        next(err)
      })
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
    let qb = this.visualizationsQueryBuilder(query)
    this.hideTestDataFromNormalUsers(qb, req)
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
    this.hideTestDataFromNormalUsers(qb, req)
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
    const qb = this.visualizationsQueryBuilder(query)
    this.hideTestDataFromNormalUsers(qb, req)
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

  submit: RequestHandler = async (req: Request, res: Response, next) => {
    const pid = parsePid(req.body.netcdf.attribute)
    const freeze = isFreeze(pid, req.headers)
    putRecord(this.conn, req.body)
      .then(result => {
        return freezeRecord(result, this.conn, pid, freeze)
      })
      .then(status => {
        return res.sendStatus(status)
      })
      .catch(err => next({ status: 500, errors: err }))
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
      if (id != body.hashSum.substr(0, 18)) {
        next({ status: 400, errors: ['Invalid ID. ID must consist of the 18 first characters of hash']})
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
      if (req.params.hash.length != 18)
        return next({ status: 400, errors: ['ID length must be exactly 18 characters']})

      this.uploadedMetadataRepo.findOne(req.params.hash, { relations: ['site', 'instrument'] })
        .then(uploadedMetadata => {
          if (uploadedMetadata == undefined) return next({ status: 404, errors: ['No metadata was found with provided id']})
          res.send(uploadedMetadata)
        })
        .catch(err => next({ status: 500, errors: err}))
    }

  listMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    const query: any = {
      site: req.query.site || (await fetchAll<Site>(this.conn, Site)).map(site => site.id),
      status: req.query.status || [Status.UPLOADED, Status.CREATED, Status.PROCESSED],
      dateFrom: req.query.dateFrom || '1970-01-01',
      dateTo: req.query.dateTo || tomorrow()
    }
    query.site = toArray(query.site)
    query.status = toArray(query.status)

    this.uploadedMetadataRepo.createQueryBuilder('um')
      .leftJoinAndSelect('um.site', 'site')
      .leftJoinAndSelect('um.instrument', 'instrument')
      .where('um.measurementDate >= :dateFrom AND um.measurementDate <= :dateTo', query)
      .andWhere('site.id IN (:...site)', query)
      .andWhere('um.status IN (:...status)', query)
      .orderBy('um.measurementDate', 'ASC')
      .getMany()
      .then(uploadedMetadata => res.send(uploadedMetadata))
      .catch(err => {next({status: 500, errors: err})})
  }

  updateMetadata: RequestHandler = async (req: Request, res: Response, next) => {
    this.uploadedMetadataRepo.update({id: req.params.hash}, req.body)
      .then(updatedResults => {
        if (updatedResults.affected == 0) return next({ status: 404, errors: ['No metadata was found with provided id']})
        res.send(updatedResults)
      })
      .catch(err => { next({ status: 500, errors: err}) })
  }

}

function parsePid(attributes: Array<any>): string {
  const { pid = '' }:any = attributes
    .map((a) => a.$)
    .map(({ name, value }) => ({ [name]: value }))
    .reduce((acc, cur) => Object.assign(acc, cur))
  return pid
}

function isFreeze(pid:string, header:any): any {
  const xFreeze = header['x-freeze'] || 'false'
  return (pid.length > 0) && (xFreeze.toLowerCase() == 'true')
}
