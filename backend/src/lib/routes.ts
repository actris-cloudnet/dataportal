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

export class Routes {

  constructor(conn: Connection) {
    this.conn = conn
    this.publicDir = config.publicDir
    this.fileServerUrl = config.fileServerUrl
    this.fileRepo = this.conn.getRepository(File)
    this.siteRepo = this.conn.getRepository(Site)
    this.productRepo = this.conn.getRepository(Product)
  }

  private conn: Connection
  private publicDir: string
  private fileServerUrl: string
  private fileRepo: Repository<File>
  private siteRepo: Repository<Site>
  private productRepo: Repository<Product>

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

    this.siteRepo.findByIds(query.location)
      .then(res => {
        if (res.length != query.location.length) throw { status: 404, errors: ['One or more of the specified locations were not found'], params: req.query }
      })
      .catch(next)

    this.productRepo.findByIds(query.product)
      .then(res => {
        if (res.length != query.product.length) throw { status: 404, errors: ['One or more of the specified products were not found'], params: req.query }
      })
      .catch(next)

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

  allfiles: RequestHandler = async (_req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(this.augmentFiles(result)))
      .catch(err => next({ status: 500, errors: err }))

  submit: RequestHandler = async (req: Request, res: Response, next) => {
    const attributes = req.body.netcdf.attribute
    let pid:string=''
    for (let n=0; n < attributes.length; n++) {
      let {name, value} = attributes[n].$
      if (name == 'pid') pid = value
    }

    const freeze = isFreeze(pid, req.headers)
    putRecord(this.conn, req.body)
      .then(result => {
        return freezeRecord(result, this.conn, pid, freeze)
      })
      .then(status => {
        res.sendStatus(status)
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

function isFreeze(pid:string, header:any): boolean {
  Object.keys(header).forEach(key => {
    const value = header[key]
    delete header[key]
    header[key.toLowerCase()] = value.toLowerCase()
  })
  const key = 'x-freeze'
  return (pid.length > 0) && (key in header) && (header[key] == 'true')
}
