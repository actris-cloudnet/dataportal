import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ErrorRequestHandler } from 'express'
import { RequestError } from './entity/RequestError'
import { stringify } from './lib'
import * as express from 'express'
import config from './config'
import { Middleware } from './lib/middleware'
import { Routes } from './lib/routes';

(async function() {
  const port = parseInt(process.argv[2])
  const app = express()

  const connName = config.connectionName
  const conn = await createConnection(connName)
  const middleware = new Middleware(conn)
  const routes = new Routes(conn)

  const errorHandler: ErrorRequestHandler = (err: RequestError, _req, res, next) => {
    console.log(`Error in path ${_req.path}:`, stringify(err))
    if (!res.headersSent) {
      delete err.params
      const status = err.status || 500
      res.status(status)
      res.send(err)
    }
    next()
  }

  if (process.env.NODE_ENV != 'production') {
    app.use(function(_req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    app.get('/allfiles', routes.allfiles)
  }

  app.get('/status', routes.status)
  app.get('/file/:uuid', routes.file)
  app.get('/files', middleware.filesValidator, middleware.filesQueryAugmenter, routes.files)
  app.get('/sites', routes.sites)
  app.get('/products', routes.products)
  app.get('/download', middleware.filesValidator, middleware.filesQueryAugmenter, routes.download)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
})()
