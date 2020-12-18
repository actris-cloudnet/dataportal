import {RequestHandler} from 'express'
import {RequestErrorArray} from '../entity/RequestError'
import {Upload} from '../entity/Upload'
import validator from 'validator'
import {Site} from '../entity/Site'
import {Product} from '../entity/Product'
import {Model} from '../entity/Model'
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

  validateMD5Param: RequestHandler = (req, _res, next) =>
    validator.isMD5(req.params.checksum)
      ? next()
      : next({status: 400, error: 'Checksum is not an MD5 hash'})

  filesValidator: RequestHandler = (req, _res, next) => {

    const checkFieldNames = (validKeys: string[], query: any) => Object.keys(query).filter(key => !validKeys.includes(key))

    const requestError: RequestErrorArray = { status: 400, errors: [] }

    if (Object.keys(req.query).length == 0) {
      requestError.errors.push('No search parameters given')
      return next(requestError)
    }

    let validKeys = ['site', 'volatile', 'product', 'dateFrom', 'dateTo', 'developer',
      'releasedBefore', 'allVersions', 'limit', 'showLegacy', 'model', 'allModels']
    if (req.path.includes('visualization')) validKeys.push('variable')

    const unknownFields = checkFieldNames(validKeys, req.query)
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`)
    }

    const keys = ['site', 'product', 'dateFrom', 'dateTo', 'volatile', 'limit', 'date']
    keys.forEach(key => {
      const keyError = this.checkField(key, req.query)
      if (keyError) requestError.errors.push(keyError)
    })

    requestError.errors = this.checkModelParamConflicts(requestError.errors, req.query)

    if (requestError.errors.length > 0) return next(requestError)
    return next()
  }

  filesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query as any
    const defaultSite = async () => (await fetchAll<Site>(this.conn, Site))
      .filter(site => !(req.query.developer === undefined && site.isTestSite))
      .filter(site => !site.isModelOnlySite)
      .map(site => site.id)
    const defaultProduct = async () => (await fetchAll<Product>(this.conn, Product))
      .map(product => product.id)
    const defaultDateFrom = () => new Date('1970-01-01')
    const defaultDateTo = tomorrow
    const setVolatile = () => ('volatile' in query) ? toArray(query.volatile) : [true, false]
    const setLegacy = () => ('showLegacy' in query) && query.showLegacy.toLowerCase() == 'true' ? [true, false] : [false]
    if (!('site' in query)) query.site = await defaultSite()
    if (!('product' in query)) query.product = await defaultProduct()
    if (!('dateFrom' in query)) query.dateFrom = defaultDateFrom()
    if (!('dateTo' in query)) query.dateTo = defaultDateTo()
    if (!('releasedBefore' in query)) query.releasedBefore = defaultDateTo()
    query.site = toArray(query.site)
    query.product = toArray(query.product)
    query.model = toArray(query.model)
    query.volatile = setVolatile()
    query.showLegacy = setLegacy()
    next()
  }

  modelFilesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query as any
    const defaultSite = async () => (await fetchAll<Site>(this.conn, Site))
      .map(site => site.id)
    const defaultModel = async () => (await fetchAll<Model>(this.conn, Model))
      .map(model => model.id)
    if (!('site' in query)) query.site = await defaultSite()
    if (!('model' in query)) query.model = await defaultModel()
    query.site = toArray(query.site)
    query.model = toArray(query.model)
    next()
  }

  getSiteNameFromAuth: RequestHandler = async (req, _res, next) => {
    const [authMethod, base64AuthString] = (req.header('authorization') || '').split(' ')
    if (!authMethod || !base64AuthString || authMethod.toLowerCase() != 'basic') return next({status: 400, errors: ['Invalid authentication method']})
    const authString = (Buffer.from(base64AuthString, 'base64')).toString('utf8')
    const [site] = authString.split(':')
    req.params.site = site
    return next()
  }

  getSiteNameFromBody: RequestHandler = async (req, _res, next) => {
    if (!req.body.site) next({status: 422, error: 'Missing site'})
    req.params.site = req.body.site
    next()
  }

  getSiteNameFromMeta: RequestHandler = async (req, _res, next) => {
    const md = await this.conn.getRepository(Upload)
      .findOne({checksum: req.params.checksum}, { relations: ['site'] })
    if (md != undefined) req.params.site = md.site.id
    next()
  }

  checkParamsExistInDb: RequestHandler = async (req: any, _res, next) => {
    Promise.all([
      this.checkSite(req),
      this.checkParam('product', req),
      this.checkParam('model', req)
    ])
      .then(() => next())
      .catch(next)
  }

  private throw404Error = (param: string, req: any) => {
    throw { status: 404, errors: [`One or more of the specified ${param}s were not found`], params: req.query }
  }

  private checkParam = async (param: string, req: any) => {
    if (!req.query[param]) return Promise.resolve()
    await this.conn.getRepository(param)
      .findByIds(req.query[param])
      .then(res => {
        if (res.length != req.query[param].length) this.throw404Error(param, req)
      })
  }

  private checkSite = async (req: any) => {
    if (!req.query['site']) return Promise.resolve()
    let qb = this.conn.getRepository<Site>('site')
      .createQueryBuilder('site')
      .select()
      .where('site.id IN (:...site)', req.query)
    qb = hideTestDataFromNormalUsers(qb, req)
    await qb.getMany()
      .then((res: any[]) => {
        if (res.length != req.query.site.length) this.throw404Error('site', req)
      })
  }

  private checkField = (key: string, query: any): string | void => {

    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0

    switch (key) {
    case 'product':
      if (key in query && !((typeof query[key] == 'string' && validator.isAlphanumeric(query[key]))
          || isArrayWithElements(query[key]))) {
        return (`Malformed ${key}`)
      }
      break
    case 'dateTo':
    case 'dateFrom':
    case 'date':
      if (key in query && !isValidDate(query[key])) {
        return (`Malformed date in property "${key}"`)
      }
      break
    case 'limit':
      if (key in query && isNaN(parseInt(query[key]))) {
        return (`Malformed value in property "${key}"`)
      }
      break
    case 'volatile':
      if (key in query && !(query[key].toLowerCase() == 'true' || query[key].toLowerCase() == 'false')) {
        return (`Malformed value in property "${key}"`)
      }
    }
  }

  private checkModelParamConflicts = (errors: string[], query: any) => {
    if (query.allModels && query.model) errors.push('Properties "allModels" and "model" can not be both defined')
    return errors
  }

}
