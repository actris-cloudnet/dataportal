import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response, RequestHandler, ErrorRequestHandler } from 'express'
import { File } from './entity/File'
import { RequestError } from './entity/RequestError'
import { stringify } from './lib'
import * as express from 'express'

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
    const errors: Array<string> = []
    if(Object.entries(req.params).length == 0) {
      errors.push('No search parameters given')
    }
    if(errors.length > 0) {
      next({status: 400, errors})
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
    const repo = conn.getRepository(File)
    repo.find({...req.params, ...{ relations: ['site'] }})
      .then(result => res.send(result))
      .catch(_ => next({status: 404, errors: 'Not found'}))
  })

  const errorHandler: ErrorRequestHandler = (err: RequestError, _req, res, next) => {
    console.log(`Error in path ${_req.path}:`, stringify(err))
    res.status(err.status)
    res.send(err)
    next()
  }

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
}

init()
