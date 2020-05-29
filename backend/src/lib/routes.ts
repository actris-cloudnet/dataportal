import { File } from '../entity/File'
import { Site } from '../entity/Site'
import { Product } from '../entity/Product'
import { SelectQueryBuilder, Connection, Repository } from 'typeorm'
import { Request, Response, RequestHandler } from 'express'
import { dateToUTCString } from '.'
import { join, basename } from 'path'
import archiver = require('archiver')
import { createReadStream, promises as fsp, constants as fsconst } from 'graceful-fs'
import { fetchAll } from '.'
import config from '../config'
import { putRecord, freezeRecord } from '../metadata2db.js'
import {Visualization} from '../entity/Visualization'


export class Routes {

  constructor(conn: Connection) {
    this.conn = conn
    this.publicDir = config.publicDir
    this.fileServerUrl = config.fileServerUrl
    this.fileRepo = this.conn.getRepository(File)
    this.siteRepo = this.conn.getRepository(Site)
    this.productRepo = this.conn.getRepository(Product)
    this.visualizationRepo = this.conn.getRepository(Visualization)
  }

  private conn: Connection
  private publicDir: string
  readonly fileServerUrl: string
  private fileRepo: Repository<File>
  private siteRepo: Repository<Site>
  private productRepo: Repository<Product>
  private visualizationRepo: Repository<Visualization>

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

  private allFilesAreReadable = (filepaths: string[]) =>
    Promise.all(filepaths.map(filepath => fsp.access(filepath, fsconst.R_OK)))

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
    const file = await this.fileRepo.findOneOrFail(req.body.sourceFileId)
    const viz = new Visualization(req.params.filename, body.variableId, body.variableHumanReadableName, file)
    return this.visualizationRepo.insert(viz)
      .then(_ => res.sendStatus(201))
      .catch(err => {
        res.sendStatus(500)
        next(err)
      })
  }

  getVisualization: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    const qb = this.filesQueryBuilder(query)
      .leftJoinAndSelect('file.visualizations', 'visualizations')
    this.hideTestDataFromNormalUsers(qb, req)
      .getMany()
      .then(result =>
        res.send(result
          .map(res => res.visualizations)
          .reduce((acc, val) => acc.concat(val))))
      .catch(err => next({ status: 500, errors: err }))
  }

  allfiles: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(this.augmentFiles(result)))
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
