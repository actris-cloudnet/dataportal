import {Request, RequestHandler, Response} from 'express'
import {Collection} from '../entity/Collection'
import {Connection, EntityManager, Repository, SelectQueryBuilder, In} from 'typeorm'
import {isFile, RegularFile} from '../entity/File'
import {
  checkFileExists, convertToReducedResponse,
  convertToSearchResponse,
  getS3pathForFile,
  hideTestDataFromNormalUsers,
  sortByMeasurementDateAsc, toArray,
  dateforsize, streamHandler
} from '../lib'
import {augmentFile} from '../lib/'
import {SearchFile} from '../entity/SearchFile'
import {Model} from '../entity/Model'
import {basename} from 'path'
import {ModelFile} from '../entity/File'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import {Visualization} from '../entity/Visualization'
import {ModelVisualization} from '../entity/ModelVisualization'
import {Product} from '../entity/Product'


export class FileRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.collectionRepo = conn.getRepository<Collection>('collection')
    this.fileRepo = conn.getRepository<RegularFile>('regular_file')
    this.modelFileRepo = conn.getRepository<ModelFile>('model_file')
    this.searchFileRepo = conn.getRepository<SearchFile>('search_file')
    this.visualizationRepo = conn.getRepository<Visualization>('visualization')
    this.modelVisualizationRepo = conn.getRepository<ModelVisualization>('model_visualization')
    this.productRepo = conn.getRepository<Product>('product')
  }

  readonly conn: Connection
  readonly collectionRepo: Repository<Collection>
  readonly fileRepo: Repository<RegularFile>
  readonly modelFileRepo: Repository<ModelFile>
  readonly searchFileRepo: Repository<SearchFile>
  readonly visualizationRepo: Repository<Visualization>
  readonly modelVisualizationRepo: Repository<ModelVisualization>
  readonly productRepo: Repository<Product>

  file: RequestHandler = async (req: Request, res: Response, next) => {

    const getFileByUuid = (repo: Repository<RegularFile|ModelFile>, isModel: boolean|undefined) => {
      const qb = repo.createQueryBuilder('file')
        .leftJoinAndSelect('file.site', 'site')
        .leftJoinAndSelect('file.product', 'product')
      if (isModel) qb.leftJoinAndSelect('file.model', 'model')
      qb.where('file.uuid = :uuid', req.params)
      return hideTestDataFromNormalUsers<RegularFile|ModelFile>(qb, req)
        .getOne()
    }

    this.findAnyFile(getFileByUuid)
      .then(file => {
        if (file == null) return next({ status: 404, errors: ['No files match this UUID'] })
        res.send(augmentFile(false)(file))
      })
      .catch(err => next(err))
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any
    this.filesQueryBuilder(query, 'file')
      .stream()
      .then(stream => streamHandler(stream, res, 'file', augmentFile(query.s3path)))
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  modelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any
    this.filesQueryBuilder(query, 'model')
      .stream()
      .then(stream => streamHandler(stream, res, 'file', augmentFile(query.s3path)))
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  search: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query as any
    const converterFunction = query.properties
      ? convertToReducedResponse(toArray(query.properties) as (keyof SearchFileResponse)[])
      : convertToSearchResponse

    this.searchFilesQueryBuilder(query)
      .stream()
      .then(stream => streamHandler(stream, res, 'file', converterFunction))
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  putFile: RequestHandler = async (req: Request, res: Response, next) => {
    const file = req.body
    file.s3key = req.params[0]
    file.updatedAt = new Date()
    if (!isFile(file)) return next({status: 422, errors: ['Request body is missing fields or has invalid values in them']})
    if (!isValidFilename(file)) return next({status: 400, errors: ['Filename does not match file metadata']})
    const isModel = file.model && true

    try {
      const sourceFileIds = req.body.sourceFileIds || []
      await Promise.all(sourceFileIds.map(async (uuid: string) =>
        (await this.findAnyFile(repo => repo.findOne(uuid)) || Promise.reject())))
    } catch (e) {
      return next({status: 422, errors: ['One or more of the specified source files were not found']})
    }

    try {
      await checkFileExists(getS3pathForFile(file))
    } catch (e) {
      console.error(e)
      return next({status: 400, errors: ['The specified file was not found in storage service']})
    }

    try {
      const findFileByName = (model: boolean) => {
        const repo = model ? this.modelFileRepo : this.fileRepo
        const qb = repo.createQueryBuilder('file')
        if (!model)
          qb.innerJoin(sub_qb =>
            sub_qb.from('search_file', 'searchfile'),
          'best_version',
          'file.uuid = best_version.uuid')
        return qb.leftJoinAndSelect('file.site', 'site')
          .where("regexp_replace(s3key, '.+/', '') = :filename", {filename: basename(file.s3key)}) // eslint-disable-line quotes
          .getOne()
      }
      const existingFile = await findFileByName(isModel)
      const searchFile = new SearchFile(file)

      const FileClass = isModel ? ModelFile : RegularFile
      if (existingFile == undefined) { // New file
        file.createdAt = file.updatedAt
        await this.conn.transaction(async transactionalEntityManager => {
          if (isModel) {
            await FileRoutes.updateModelSearchFile(transactionalEntityManager, file, searchFile)
          } else {
            await transactionalEntityManager.insert(SearchFile, searchFile)
          }
          await transactionalEntityManager.insert(FileClass, file)
        })
        res.sendStatus(201)
      } else if (existingFile.site.isTestSite || existingFile.volatile) { // Replace existing
        file.createdAt = existingFile.createdAt
        await this.conn.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.update(FileClass, {uuid: file.uuid}, file)
          await transactionalEntityManager.update(SearchFile, {uuid: file.uuid}, searchFile)
        })
        res.sendStatus(200)
      } else if (existingFile.uuid != file.uuid) { // New version
        if (isModel) return next({status: 501, errors: ['Versioning is not supported for model files.']})
        await this.conn.transaction(async transactionalEntityManager => {
          file.createdAt = file.updatedAt
          await transactionalEntityManager.insert(FileClass, file)
          if (!file.legacy) { // Don't display legacy files in search if cloudnet version is available
            await transactionalEntityManager.delete(SearchFile, {uuid: existingFile.uuid})
            await transactionalEntityManager.insert(SearchFile, searchFile)
          }
        })
        res.sendStatus(200)
      } else {
        next({
          status: 403,
          errors: ['File exists and cannot be updated since it is freezed and not from a test site']
        })
      }
    } catch (e) {
      next({status: 500, errors: e})
    }
  }

  postFile: RequestHandler = async (req: Request, res: Response, next) => {
    const partialFile = req.body
    if (!partialFile.uuid) return next({status: 422, errors: ['Request body is missing uuid']})
    try {
      const existingFile = await this.findAnyFile((repo) => repo.findOne(partialFile.uuid, {relations: ['product']}))
      if (!existingFile) return next({status: 422, errors: ['No file matches the provided uuid']})
      let repo: Repository<RegularFile|ModelFile> = this.fileRepo
      if (existingFile.product.id == 'model') repo = this.modelFileRepo
      await repo.update({uuid: partialFile.uuid}, partialFile)
      delete partialFile.pid // No PID in SearchFile
      delete partialFile.checksum // No checksum in SearchFile
      delete partialFile.version // No version in SearchFile
      if (await this.searchFileRepo.findOne(partialFile.uuid))
        await this.searchFileRepo.update({uuid: partialFile.uuid}, partialFile)
      res.sendStatus(200)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }

  deleteFile: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid = req.params.uuid
    const query: any = req.query
    const ignoreHigherProducts = 'ignoreHigherProducts' in query && query.ignoreHigherProducts.toLowerCase() === 'true'
    try {
      const existingFile = await this.findAnyFile((repo) => repo.findOne(uuid, {relations: ['product', 'site']}))
      if (!existingFile) return next({status: 422, errors: ['No file matches the provided uuid']})
      if (!existingFile.volatile) return next({status: 422, errors: ['Forbidden to delete a stable file']})
      let fileRepo: Repository<RegularFile|ModelFile> = this.fileRepo
      let visuRepo: Repository<Visualization|ModelVisualization> = this.visualizationRepo
      if (existingFile.product.id == 'model') {
        fileRepo = this.modelFileRepo
        visuRepo = this.modelVisualizationRepo
      }
      const higherLevelProductNames = await this.getHigherLevelProducts(existingFile.product)
      let products = await this.fileRepo.find({where: {
        site: existingFile.site,
        measurementDate: existingFile.measurementDate,
        product: In(higherLevelProductNames)
      }})
      if (!ignoreHigherProducts && products.length > 0) {
        const onlyVolatileProducts = products.every(product => product.volatile)
        if (!onlyVolatileProducts) return next({status: 422, errors: ['Forbidden to delete due to higher level stable files']})
        for (const product of products) {
          await this.deleteFileAndVisualizations(this.fileRepo, this.visualizationRepo, product.uuid)
        }
      }
      await this.deleteFileAndVisualizations(fileRepo, visuRepo, uuid)
      res.sendStatus(200)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }

  allfiles: RequestHandler = async (req: Request, res: Response, next) =>
    this.fileRepo.find({ relations: ['site', 'product'] })
      .then(result => res.send(sortByMeasurementDateAsc(result).map(augmentFile(false))))
      .catch(err => next({ status: 500, errors: err }))

  allsearch: RequestHandler = async (req: Request, res: Response, next) =>
    this.searchFileRepo.find({ relations: ['site', 'product'] })
      .then(result => {
        res.send(sortByMeasurementDateAsc(result).map(convertToSearchResponse))
      })
      .catch(err => next({ status: 500, errors: err }))

  filesQueryBuilder(query: any, mode: 'file'|'model') {
    const isModel = mode == 'model'
    let repo: Repository<RegularFile|ModelFile> = this.fileRepo
    if (isModel) {
      repo = this.modelFileRepo
    }
    let qb = repo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
    if (isModel) qb.leftJoinAndSelect('file.model', 'model')

    // Where clauses
    qb = addCommonFilters(qb, query)
    if (isModel && query.model) qb.andWhere('model.id IN (:...model)', query)
    if (query.filename) qb.andWhere("regexp_replace(s3key, '.+/', '') IN (:...filename)", query) // eslint-disable-line quotes
    if (query.releasedBefore) qb.andWhere('file.updatedAt < :releasedBefore', query)
    if (query.updatedAtFrom) qb.andWhere('file.updatedAt >= :updatedAtFrom', query)
    if (query.updatedAtTo) qb.andWhere('file.updatedAt <= :updatedAtTo', query)

    // No allVersions, allModels or model/filename params (default)
    if (query.allVersions == undefined
    && query.model == undefined
    && query.allModels == undefined
    && !(isModel && query.filename)) { // On model route we want to return all models if filename is specified
      qb.innerJoin(sub_qb => // Default functionality
        sub_qb
          .from('search_file', 'searchfile'),
      'best_version',
      'file.uuid = best_version.uuid')
    }

    // Ordering
    qb.orderBy('file.measurementDate', 'DESC')
    if (isModel) qb.addOrderBy('model.optimumOrder', 'ASC')
    qb.addOrderBy('file.legacy', 'ASC')
      .addOrderBy('file.updatedAt', 'DESC')

    // Limit
    if ('limit' in query) qb.limit(parseInt(query.limit))

    return qb
  }

  searchFilesQueryBuilder(query: any) {
    let qb = this.searchFileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
    qb = addCommonFilters(qb, query)
    qb.orderBy('file.measurementDate', 'DESC')
    if ('limit' in query) qb.limit(parseInt(query.limit))
    return qb
  }

  private static async updateModelSearchFile(transactionalEntityManager: EntityManager, file: any, searchFile: SearchFile) {
    const {optimumOrder} = await transactionalEntityManager.findOneOrFail(Model, {id: file.model})
    const [bestModelFile] = await transactionalEntityManager.createQueryBuilder(ModelFile, 'file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .leftJoinAndSelect('file.model', 'model')
      .andWhere('site.id = :site', file)
      .andWhere('product.id = :product', file)
      .andWhere('file.measurementDate = :measurementDate', file)
      .addOrderBy('model.optimumOrder', 'ASC')
      .getMany()
    if (!bestModelFile) return transactionalEntityManager.insert(SearchFile, searchFile)
    if (bestModelFile.model.optimumOrder >= optimumOrder) {
      await transactionalEntityManager.delete(SearchFile, {
        site: file.site,
        product: file.product,
        measurementDate: file.measurementDate
      })
      await transactionalEntityManager.insert(SearchFile, searchFile)
    }
  }

  public findAnyFile(searchFunc: (arg0: Repository<RegularFile|ModelFile>, arg1?: boolean) =>
  Promise<RegularFile|ModelFile|undefined>):
    Promise<RegularFile|ModelFile|undefined> {
    return Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true)
    ])
      .then(([file, modelFile]) => file ? file : modelFile)
  }

  findAllFiles(searchFunc: (arg0: Repository<RegularFile|ModelFile>, arg1?: boolean) => Promise<(RegularFile|ModelFile)[]>):
    Promise<(RegularFile|ModelFile)[]> {
    return Promise.all([
      searchFunc(this.fileRepo, false),
      searchFunc(this.modelFileRepo, true)
    ])
      .then(([files, modelFiles]) => files.concat(modelFiles))
  }

  public getRepoForFile(file: RegularFile|ModelFile) {
    if (file.product.id == 'model') return this.modelFileRepo
    return this.fileRepo
  }

  dateforsize: RequestHandler = async (req, res, next) => {
    const isModel = 'model' in req.query
    return dateforsize(isModel ? this.modelFileRepo : this.fileRepo, isModel ? 'model_file' : 'regular_file', req, res, next)
  }

  private async deleteFileAndVisualizations(fileRepo: Repository<RegularFile|ModelFile>,
    visualizationRepo: Repository<Visualization|ModelVisualization>,
    uuid: string) {
    await visualizationRepo.createQueryBuilder()
      .delete()
      .where({ sourceFile: uuid })
      .execute()
    await fileRepo.createQueryBuilder()
      .delete()
      .where({ uuid: uuid })
      .execute()
    await this.searchFileRepo.createQueryBuilder()
      .delete()
      .where({ uuid: uuid })
      .execute()
  }

  private async getHigherLevelProducts(product: Product):Promise<string[]> {
    // Returns Cloudnet products that are of higher level than the given product.
    let uniqueLevels = await this.productRepo
      .createQueryBuilder()
      .select('DISTINCT level')
      .orderBy('level')
      .getRawMany()
    uniqueLevels = uniqueLevels.map(level => level.level)
    const index = uniqueLevels.indexOf(product.level)
    const levels =  uniqueLevels.slice(index + 1)
    let products = await this.productRepo
      .createQueryBuilder()
      .where({level: In(levels)})
      .select('id')
      .getRawMany()
    return products.map(prod => prod.id)
  }

}

function addCommonFilters<T>(qb: SelectQueryBuilder<T>, query: any) {
  qb.andWhere('site.id IN (:...site)', query)
  if (query.product) qb.andWhere('product.id IN (:...product)', query)
  if (query.dateFrom) qb.andWhere('file.measurementDate >= :dateFrom', query)
  if (query.dateTo) qb.andWhere('file.measurementDate <= :dateTo', query)
  if (query.volatile) qb.andWhere('file.volatile IN (:...volatile)', query)
  if (query.legacy) qb.andWhere('file.legacy IN (:...legacy)', query)
  return qb as SelectQueryBuilder<T>
}

function isValidFilename(file: any) {
  const [date, site] = basename(file.s3key).split('.')[0].split('_')
  return (
    file.measurementDate.replace(/-/g, '') == date
    && (file.site == site || typeof file.site == 'object')
  )
}

