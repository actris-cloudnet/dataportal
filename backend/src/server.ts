import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response, RequestHandler, ErrorRequestHandler } from 'express'
import { File } from './entity/File'
import { Site } from './entity/Site'
import { RequestError, RequestErrorArray } from './entity/RequestError'
import { stringify } from './lib'
import * as express from 'express'
import validator from 'validator'

const port = parseInt(process.argv[2])
const connName: string = process.env.NODE_ENV == 'test' ? 'test' : 'default'

async function init() {
  const app = express()

  const conn = await createConnection(connName)

  if(process.env.NODE_ENV != 'production') {
    app.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })
  }

  const filesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = {status: 400, errors: []}
    const query = req.query

    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0
    const pushAndReturn = (err: RequestErrorArray, el: string) => {
      err.errors.push(el)
      return err
    }

    if(Object.keys(query).length == 0) {
      return next(pushAndReturn(requestError, 'No search parameters given'))
    } else {
      if(!('location' in query)) {
        return next(pushAndReturn(requestError, 'Property "location" is mandatory'))
      }
      if(!((typeof query.location == 'string' && validator.isAlphanumeric(query.location))
      || isArrayWithElements(query.location))) {
        requestError.errors.push('Malformed location')
      }
    }
    if(requestError.errors.length > 0) {
      next(requestError)
    } else {
      next()
    }
  }

  app.get('/file/:uuid', async (req: Request, res: Response) => {
    const repo = conn.getRepository(File)
    repo.findOneOrFail(req.params.uuid, { relations: ['site']})
      .then(result => res.send(result))
      .catch(_ => res.sendStatus(404))
  })

  app.get('/files', filesValidator, async (req: Request, res: Response, next) => {
    const fileRepo = conn.getRepository(File)
    const siteRepo = conn.getRepository(Site)
    const query = req.query
    const queryLocationToArray = (obj: string | Array<string>): Array<string> =>
      (typeof obj == 'string') ? [ obj ] : obj

    const locations = queryLocationToArray(query.location)

    siteRepo.findByIds(locations)
      .then(res => {
        if(res.length != locations.length) throw {status: 404, errors: ['One or more of the specified locations were not found'], params: req.query}
      })
      .catch(next)
    const where = locations.map(site => ({site: {id: site}}))
    fileRepo.find({ where, relations: ['site'] })
      .then(result => {
        if(result.length == 0) {
          next({status: 404, errors: ['The search yielded zero results'], params: req.query})
          return
        }
        res.send(result)
      })
      .catch(err=> {
        next({status: 500, errors: err})
      })
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
