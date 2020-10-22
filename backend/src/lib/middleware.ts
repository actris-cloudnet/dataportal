import {RequestHandler} from 'express'
import {RequestErrorArray} from '../entity/RequestError'
import validator from 'validator'
import {Site} from '../entity/Site'
import {Product} from '../entity/Product'
import {ModelType} from '../entity/ModelType'
import {Connection} from 'typeorm'
import {fetchAll, hideTestDataFromNormalUsers, isValidDate, toArray, tomorrow} from '.'
import {validate as validateUuid} from 'uuid'

export class Middleware {

  constructor(conn: Connection) {
    this.conn = conn
  }

  private conn: Connection

  validateUuidParam: RequestHandler = (req, _res, next) => {
    /* eslint-disable prefer-template */
    const addDashesToUuid = (uuid: string) =>
      uuid.substr(0,8)+'-'
      +uuid.substr(8,4)+'-'
      +uuid.substr(12,4)+'-'
      +uuid.substr(16,4)+'-'
      +uuid.substr(20)
    /* eslint-enable prefer-template */
    const uuid = req.params.uuid.includes('-') ? req.params.uuid : addDashesToUuid(req.params.uuid)
    if (!validateUuid(uuid)) return next({status: 404, errors: ['Not found: invalid UUID']})
    return next()
  }

  private pushAndReturn = (err: RequestErrorArray, msg: string) => {
    err.errors.push(msg)
    return err
  }

  private checkFieldNames = (validKeys: string[], query: any) => Object.keys(query).filter(key => !validKeys.includes(key))

  private checkField = (key: string, err: RequestErrorArray, query: any) => {
    switch (key) {
    case 'product':
      if (key in query && !((typeof query[key] == 'string' && validator.isAlphanumeric(query[key]))
          || this.isArrayWithElements(query[key]))) {
        err.errors.push(`Malformed ${key}`)
      }
      break
    case 'dateTo':
    case 'dateFrom':
    case 'date':
      if (key in query && !isValidDate(query[key])) {
        err.errors.push(`Malformed date in property "${key}"`)
      }
      break
    case 'limit':
      if (key in query && isNaN(parseInt(query[key]))) {
        err.errors.push(`Malformed value in property "${key}"`)
      }
      break
    case 'volatile':
      if (key in query && !(query[key].toLowerCase() == 'true' || query[key].toLowerCase() == 'false')) {
        err.errors.push(`Malformed value in property "${key}"`)
      }
    }
  }

  filesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = { status: 400, errors: [] }
    const query = req.query as any

    if (Object.keys(query).length == 0) {
      return next(this.pushAndReturn(requestError, 'No search parameters given'))
    }

    let validKeys = ['location', 'product', 'dateFrom', 'dateTo', 'developer', 'volatile', 'releasedBefore', 'allVersions', 'limit']
    if (req.path.includes('visualization')) validKeys.push('variable')
    const unknownFields = this.checkFieldNames(validKeys, query)
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`)
    }

    const keys = ['location', 'product', 'dateFrom', 'dateTo', 'volatile', 'limit']
    keys.forEach(key => {
      this.checkField(key, requestError, query)
    })

    if (requestError.errors.length > 0) return next(requestError)
    return next()

  }

  modelFilesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = { status: 400, errors: [] }
    const query = req.query as any

    if (Object.keys(query).length == 0) {
      return next(this.pushAndReturn(requestError, 'No search parameters given'))
    }

    const validKeys = ['location', 'modelType', 'date', 'volatile']
    const unknownFields = this.checkFieldNames(validKeys, query)
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`)
    }

    const keys = ['location', 'date', 'volatile']
    keys.forEach(key => {
      this.checkField(key, requestError, query)
    })

    if (requestError.errors.length > 0) return next(requestError)
    return next()

  }

  filesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query as any
    const defaultLocation = async () => (await fetchAll<Site>(this.conn, Site))
      .filter(site => !(req.query.developer === undefined && site.isTestSite && !site.isModelOnlySite))
      .map(site => site.id)
    const defaultProduct = async () => (await fetchAll<Product>(this.conn, Product))
      .map(product => product.id)
    const defaultDateFrom = () => new Date('1970-01-01')
    const defaultDateTo = tomorrow
    const setVolatile = () => ('volatile' in query) ? toArray(query.volatile) : [true, false]

    // Set defaults
    if (!('location' in query)) query.location = await defaultLocation()
    if (!('product' in query)) query.product = await defaultProduct()
    if (!('dateFrom' in query)) query.dateFrom = defaultDateFrom()
    if (!('dateTo' in query)) query.dateTo = defaultDateTo()
    if (!('releasedBefore' in query)) query.releasedBefore = defaultDateTo()
    query.location = toArray(query.location)
    query.product = toArray(query.product)
    query.volatile = setVolatile()

    next()
  }

  modelFilesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query as any
    const defaultLocation = async () => (await fetchAll<Site>(this.conn, Site))
      .map(site => site.id)
    const defaultModelType = async () => (await fetchAll<ModelType>(this.conn, ModelType))
      .map(modelType => modelType.id)
    const setVolatile = () => ('volatile' in query) ? toArray(query.volatile) : [true, false]
    if (!('location' in query)) query.location = await defaultLocation()
    if (!('modelType' in query)) query.modelType = await defaultModelType()
    query.location = toArray(query.location)
    query.modelType = toArray(query.modelType)
    query.volatile = setVolatile()
    next()
  }

  private throwError = (param: string, req: any) => {
    throw { status: 404, errors: [`One or more of the specified ${param}s were not found`], params: req.query }
  }

  private checkParam = async (repo: string, param: string, req: any) => {
    await this.conn.getRepository(repo)
      .findByIds(req.query[param])
      .then(res => {
        if (res.length != req.query[param].length) this.throwError(param, req)
      })
  }

  private checkSite = async (hideTestSites: boolean, req: any) => {
    let qb = this.conn.getRepository<Site>('site')
      .createQueryBuilder('site')
      .select()
      .where('site.id IN (:...location)', req.query)
    if (hideTestSites) qb = hideTestDataFromNormalUsers(qb, req)
    await qb.getMany()
      .then((res: any[]) => {
        if (res.length != req.query.location.length) this.throwError('location', req)
      })
  }

  checkParamsExistInDb: RequestHandler = async (req: any, _res, next) => {
    Promise.all([
      this.checkSite(true, req),
      this.checkParam('product', 'product', req)
    ])
      .then(() => next())
      .catch(next)
  }

  checkModelParamsExistInDb: RequestHandler = async (req: any, _res, next) => {
    Promise.all([
      this.checkSite(false, req),
      this.checkParam('model_type', 'modelType', req)
    ])
      .then(() => next())
      .catch(next)
  }

}
