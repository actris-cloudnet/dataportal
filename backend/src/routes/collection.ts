import {Request, RequestHandler, Response} from 'express'
import {Collection} from '../entity/Collection'
import {CollectionResponse} from '../entity/CollectionResponse'
import {validate as validateUuid} from 'uuid'
import axios from 'axios'
import config from '../config'
import {Connection, Repository} from 'typeorm'
import {File} from '../entity/File'
import {convertToSearchResponse} from '../lib'

export class CollectionRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.fileRepo = conn.getRepository<File>('file')
    this.publicDir = config.publicDir
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<File>
  readonly publicDir: string

  postCollection: RequestHandler = async (req: Request, res: Response, next) => {
    if (!('files' in req.body) || !req.body.files || !Array.isArray(req.body.files)) {
      next({status: 422, errors: ['Request is missing field "files"']})
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

  collection: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid: string = req.params.uuid
    try {
      const collection = await this.collectionRepo.findOne(uuid, {relations: [
        'files', 'files.site', 'files.product',
        'modelFiles', 'modelFiles.site', 'modelFiles.product',
      ]})
      if (collection === undefined) return next({status: 404, errors: ['Collection not found']})
      res.send(new CollectionResponse(collection))
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }

  generatePid: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    if (!body.uuid || !body.type || !validateUuid(body.uuid)) {
      return next({status: 422, errors: ['Missing or invalid uuid or type']})
    }
    if (body.type != 'collection') {
      return next({status: 422, errors: ['Type must be collection']})
    }
    try {
      const collection = await this.collectionRepo.findOne(body.uuid)
      if (collection === undefined) return next({status: 422, errors: ['Collection not found']})
      if (collection.pid) return next({status: 403, errors: ['Collection already has a PID']})
      const pidRes = await axios.post(config.pidServiceUrl, req.body, {timeout: config.pidServiceTimeoutMs})
      await this.collectionRepo.update({uuid: body.uuid}, {pid: pidRes.data.pid})
      res.send(pidRes.data)
    } catch (e) {
      if (e.code == 'ECONNABORTED') return next({status: 504, errors: ['PID service took too long to respond']})
      return next({status: 500, errors: e})
    }
  }

  allcollections: RequestHandler = async (req: Request, res: Response, next) =>
    this.collectionRepo.find({ relations: ['files', 'files.product', 'files.site'] })
      .then(collections => {
        const response = collections.map(coll => ({...coll, ...{files: convertToSearchResponse(coll.files)}}))
        res.send(response)
      })
      .catch(err => next({ status: 500, errors: err }))
}
