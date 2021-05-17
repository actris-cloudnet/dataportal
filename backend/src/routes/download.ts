import {RequestHandler} from 'express'

import {Collection} from '../entity/Collection'
import {Connection, Repository} from 'typeorm'
import {File, ModelFile, RegularFile} from '../entity/File'
import {Upload} from '../entity/Upload'
import {Download, ObjectType} from '../entity/Download'
import {getBucketForFile, ssAuthString} from '../lib'
import * as http from 'http'
import {IncomingMessage} from 'http'
import archiver = require('archiver')
import {FileRoutes} from './file'
import env from '../lib/env'
import {CollectionRoutes} from './collection'

export class DownloadRoutes {

  constructor(conn: Connection, fileController: FileRoutes, collController: CollectionRoutes) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.uploadRepo = conn.getRepository<Upload>('upload')
    this.downloadRepo = conn.getRepository<Download>('download')
    this.fileRepo = conn.getRepository<RegularFile>('regular_file')
    this.fileController = fileController
    this.collController = collController
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<RegularFile>
  readonly uploadRepo: Repository<Upload>
  readonly downloadRepo: Repository<Download>
  readonly fileController: FileRoutes
  readonly collController: CollectionRoutes

  product: RequestHandler = async (req, res, next) => {
    const s3key = req.params[0]
    try {
      const file = await this.fileController.findAnyFile(repo => repo.findOne({uuid: req.params.uuid, s3key}))
      if (file === undefined) return next({status: 404, errors: ['File not found']})
      const upstreamRes = await this.makeFileRequest(file)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-Length', file.size)
      const dl = new Download(ObjectType.Product, file.uuid, req.header('x-forwarded-for') || '')
      await this.downloadRepo.save(dl)
      upstreamRes.pipe(res, {end: true})
    } catch (e) {
      next({status: 500, errors: e})
    }
  }

  collection: RequestHandler = async (req, res, next) => {
    const collectionUuid: string = req.params.uuid
    const collection = await this.collController.findCollection(collectionUuid)
    if (collection === undefined) {
      return next({status: 404, errors: ['No collection matches this UUID.']})
    }

    const allFiles = (collection.regularFiles as unknown as File[]).concat(collection.modelFiles)
    // Update collection download count
    const dl = new Download(ObjectType.Collection, collection.uuid, req.header('x-forwarded-for') || '')
    await this.downloadRepo.save(dl)
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
        const file = allFiles[idx]
        const fileStream = await this.makeFileRequest(file)
        archive.append(fileStream, { name: file.filename })
        if (idx == (allFiles.length - 1)) archive.finalize()
      }
      archive.on('entry', () => i < allFiles.length ? appendFile(i++) : null)
      await appendFile(0)
    } catch (err) {
      res.sendStatus(500)
      next(err)
    }
  }

  image: RequestHandler = async (req, res, next) => {
    const s3key = req.params[0]
    try {
      const upstreamRes = await this.makeRequest('cloudnet-img', s3key)
      if (upstreamRes.statusCode != 200) {
        res.status(upstreamRes.statusCode || 500)
        res.setHeader('Content-Type', 'text/plain')
      } else {
        res.setHeader('Content-Type', 'image/png')
      }
      upstreamRes.pipe(res, {end: true})
    } catch (e) {
      next({status: 500, errors: e})
    }
  }

  private makeFileRequest(file: File): Promise<IncomingMessage> {
    const bucket = getBucketForFile(file)
    return this.makeRequest(bucket, file.s3key)
  }

  private async makeRequest(bucket: string, s3key: string): Promise<IncomingMessage> {
    let headers = {
      'Authorization': ssAuthString()
    }

    const requestOptions = {
      host: env.DP_SS_HOST,
      port: env.DP_SS_PORT,
      path: `/${bucket}/${s3key}`,
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
