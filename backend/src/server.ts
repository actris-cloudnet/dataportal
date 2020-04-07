import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response, RequestHandler, ErrorRequestHandler } from 'express'
import { File } from './entity/File'
import { Site } from './entity/Site'
import { RequestError, RequestErrorArray } from './entity/RequestError'
import { stringify, dateToUTCString } from './lib'
import * as express from 'express'
import validator from 'validator'
import config from './config'
import { Product } from './entity/Product'

const port = parseInt(process.argv[2])
const connName = config.connectionName

async function init() {
  const app = express()

  const conn = await createConnection(connName)

  if (process.env.NODE_ENV != 'production') {
    app.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    app.get('/allfiles', async (req: Request, res: Response, next) => {
      const fileRepo = conn.getRepository(File)
      fileRepo.find({ relations: ['site', 'product'] })
        .then(result => res.send(result))
        .catch(err=> next({status: 500, errors: err}))
    })
  }

  app.get('/status', async (_req: Request, res: Response, next) => {
    const fileRepo = conn.getRepository(File)
    fileRepo.createQueryBuilder('file') .leftJoin('file.site', 'site')
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
      .catch(err=> {
        next({status: 500, errors: err})
      })
  })

  const fetchAll = <T>(schema: Function): Promise<T[]> => {
    const repo = conn.getRepository(schema)
    return repo.find() as Promise<T[]>
  }
  const filesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = {status: 400, errors: []}
    const query = req.query

    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0
    const pushAndReturn = (err: RequestErrorArray, el: string) => {
      err.errors.push(el)
      return err
    }
    const isValidDate = (obj: any) => !isNaN(new Date(obj).getDate())


    if (Object.keys(query).length == 0) {
      return next(pushAndReturn(requestError, 'No search parameters given'))
    }

    const validKeys = ['location', 'product', 'dateFrom', 'dateTo']
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

    if (requestError.errors.length > 0) {
      return next(requestError)
    }
    return next()
  }

  const filesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query
    const toArray = (obj: string | Array<string>): Array<string> =>
      (typeof obj == 'string') ? [ obj ] : obj
    const tomorrow = () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }
    const defaultLocation = async () => (await fetchAll<Site>(Site)).map(site => site.id)
    const defaultProduct = async () => (await fetchAll<Product>(Product)).map(product => product.id)
    const defaultDateFrom = () => new Date('1970-01-01')
    const defaultDateTo = tomorrow

    // Set defaults
    if (!('location' in query)) query.location = await defaultLocation()
    if (!('product' in query)) query.product = await defaultProduct()
    if (!('dateFrom' in query)) query.dateFrom = defaultDateFrom()
    if (!('dateTo' in query)) query.dateTo = defaultDateTo()

    query.location = toArray(query.location)
    query.product = toArray(query.product)

    next()
  }

  app.get('/file/:uuid', async (req: Request, res: Response, next) => {
    const repo = conn.getRepository(File)
    repo.findOneOrFail(req.params.uuid, { relations: ['site', 'product']})
      .then(result => res.send(result))
      .catch(_ =>  next({status: 404, errors: [ 'No files match this UUID' ]}))
  })

  app.get('/files', filesValidator, filesQueryAugmenter, async (req: Request, res: Response, next) => {
    const fileRepo = conn.getRepository(File)
    const siteRepo = conn.getRepository(Site)
    const productRepo = conn.getRepository(Product)
    const query = req.query

    siteRepo.findByIds(query.location)
      .then(res => {
        if (res.length != query.location.length) throw {status: 404, errors: ['One or more of the specified locations were not found'], params: req.query}
      })
      .catch(next)

    productRepo.findByIds(query.product)
      .then(res => {
        if (res.length != query.product.length) throw {status: 404, errors: ['One or more of the specified products were not found'], params: req.query}
      })
      .catch(next)

    fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.product', 'product')
      .where('site.id IN (:...location)', query)
      .andWhere('product.id IN (:...product)', query)
      .andWhere('file.measurementDate >= :dateFrom AND file.measurementDate < :dateTo', query)
      .orderBy('file.measurementDate', 'DESC')
      .getMany()
      .then(result => {
        if (result.length == 0) {
          next({status: 404, errors: ['The search yielded zero results'], params: req.query})
          return
        }
        res.send(result)
      })
      .catch(err=> {
        next({status: 500, errors: err})
      })
  })

  app.get('/sites', async (_req: Request, res: Response, next) => {
    const repo = conn.getRepository(Site)
    repo.createQueryBuilder('site')
      .select()
      .where('not test')
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({status: 500, errors: err}))
  })

  app.get('/products', async (_req: Request, res: Response, next) => {
    fetchAll<Product>(Product)
      .then(result => res.send(result))
      .catch(err => next({status: 500, errors: err}))
  })

  const errorHandler: ErrorRequestHandler = (err: RequestError, _req, res, next) => {
    console.log(`Error in path ${_req.path}:`, stringify(err))
    delete err.params
    res.status(err.status)
    res.send(err)
    next()
  }

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
}

init()
