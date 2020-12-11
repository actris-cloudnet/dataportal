import {RequestHandler} from 'express'

import {Collection} from '../entity/Collection'
import {Connection, Repository} from 'typeorm'
import {File} from '../entity/File'
import {Upload} from '../entity/Upload'
import {Download, ObjectType} from '../entity/Download'
import {getBucketForFile, ssAuthString} from '../lib'
import config from '../config'
import * as http from 'http'
import {IncomingMessage} from 'http'
import archiver = require('archiver')

export class DownloadRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.uploadRepo = conn.getRepository<Upload>('upload')
    this.downloadRepo = conn.getRepository<Download>('download')
    this.fileRepo = conn.getRepository<File>('file')
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<File>
  readonly uploadRepo: Repository<Upload>
  readonly downloadRepo: Repository<Download>

  product: RequestHandler = async (req, res, next) => {
    const s3key = req.params[0]
    try {
      const file = await this.fileRepo.findOne({uuid: req.params.uuid, s3key})
      if (file === undefined) return next({status: 404, errors: ['File not found']})
      const upstreamRes = await this.makeRequest(file)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-Length', file.size)
      upstreamRes.pipe(res, {end: true})
      const dl = new Download(ObjectType.Product, file.uuid, req.ip)
      await this.downloadRepo.save(dl)
    } catch (e) {
      next({status: 500, errors: e})
    }
  }

  collection: RequestHandler = async (req, res, next) => {
    const collectionUuid: string = req.params.uuid
    const collection = await this.collectionRepo.findOne(collectionUuid, {relations: ['files']})
    if (collection === undefined) {
      return next({status: 404, errors: ['No collection matches this UUID.']})
    }
    try {
      const archive = archiver('zip', { store: true })
      archive.on('warning', console.error)
      archive.on('error', console.error)
      req.on('close', () => archive.abort())

      const receiverFilename = `cloudnet-collection-${new Date().getTime()}.zip`
      res.set('Content-Type', 'application/octet-stream')
      res.set('Content-Disposition', `attachment; filename="${receiverFilename}"`)
      archive.pipe(res)

      let i = 1
      const appendFile = async (idx: number) => {
        const file = collection.files[idx]
        const fileStream = await this.makeRequest(file)
        archive.append(fileStream, { name: file.filename })
        if (idx == (collection.files.length - 1)) archive.finalize()
      }
      archive.on('entry', () => i < collection.files.length ? appendFile(i++) : null)
      appendFile(0)

      // Update collection download count
      const dl = new Download(ObjectType.Product, collection.uuid, req.ip)
      this.downloadRepo.save(dl)
    } catch (err) {
      res.sendStatus(500)
      next(err)
    }
  }


  private async makeRequest(file: File): Promise<IncomingMessage> {
    const bucket = getBucketForFile(file)
    let headers = {
      'Authorization': ssAuthString()
    }

    const requestOptions = {
      host: config.storageService.host,
      port: config.storageService.port,
      path: `/${bucket}/${file.s3key}`,
      headers,
      method: 'GET'
    }

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions,  resolve)
      req.on('error', err => reject({status: 500, errors: err}))
      req.end()
    })
  }
}
