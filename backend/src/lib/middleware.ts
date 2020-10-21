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

  filesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = { status: 400, errors: [] }
    const query = req.query as any

    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0
    const pushAndReturn = (err: RequestErrorArray, el: string) => {
      err.errors.push(el)
      return err
    }


    if (Object.keys(query).length == 0) {
      return next(pushAndReturn(requestError, 'No search parameters given'))
    }

    let validKeys = ['location', 'product', 'dateFrom', 'dateTo', 'developer', 'volatile', 'releasedBefore', 'allVersions', 'limit']
    if (req.path.includes('visualization')) validKeys.push('variable')
    const unknownFields = Object.keys(query).filter(key => !validKeys.includes(key))
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`)
    }

    // Validate location
    if ('location' in query && !((typeof query.location == 'string' && validator.isAlphanumeric(query.location))
      || isArrayWithElements(query.location))) {
      requestError.errors.push('Malformed location')
    }

    // Validate product
    if ('product' in query && !((typeof query.product == 'string' && validator.isAlphanumeric(query.product))
      || isArrayWithElements(query.product))) {
      requestError.errors.push('Malformed product')
    }

    // Validate dates
    if (query.dateFrom && !isValidDate(query.dateFrom)) {
      requestError.errors.push('Malformed date in property "dateFrom"')
    }
    if (query.dateTo && !isValidDate(query.dateTo)) {
      requestError.errors.push('Malformed date in property "dateTo"')
    }

    // Validate volatile
    if ('volatile' in query && !(query.volatile.toLowerCase() == 'true' || query.volatile.toLowerCase() == 'false')) {
      requestError.errors.push('Malformed value in property "volatile"')
    }

    // Validate limit
    if ('limit' in query && isNaN(parseInt(query.limit))) {
      requestError.errors.push('Malformed value in property "limit"')
    }

    if (requestError.errors.length > 0) {
      return next(requestError)
    }
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
