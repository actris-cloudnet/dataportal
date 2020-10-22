import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ErrorRequestHandler } from 'express'
import { RequestError } from './entity/RequestError'
import { stringify } from './lib'
import * as express from 'express'
import config from './config'
import { Middleware } from './lib/middleware'
import { Routes } from './lib/routes'
import { ModelRoutes } from './lib/model-routes'
import * as xmlparser from 'express-xml-bodyparser'

(async function() {
  const port = parseInt(process.argv[2])
  const app = express()

  app.use(xmlparser())

  const connName = config.connectionName
  const conn = await createConnection(connName)
  const middleware = new Middleware(conn)
  const routes = new Routes(conn)
  const modelRoutes = new ModelRoutes(conn)

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
    app.get('/allsearch', routes.allsearch)
    app.get('/allcollections', routes.allcollections)
  }

  // public (changes to these require changes to API docs)
  app.get('/api/search',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.search)
  app.get('/api/files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.files)
  app.get('/api/files/:uuid', middleware.validateUuidParam, routes.file)
  app.get('/api/sites', routes.sites)
  app.get('/api/products', routes.products)
  app.get('/api/instruments', routes.instruments)

  // model api (public)
  app.get('/api/model-files/:uuid', modelRoutes.modelFile)
  app.get('/api/model-types', modelRoutes.modelTypes)
  app.get('/api/model-files',
    middleware.modelFilesValidator,
    middleware.modelFilesQueryAugmenter,
    middleware.checkModelParamsExistInDb,
    modelRoutes.modelFiles)

  // public/internal
  app.get('/api/status', routes.status)
  app.get('/api/products/variables', routes.productVariables)
  app.get('/api/download/:uuid', middleware.validateUuidParam, routes.download)
  app.get('/api/visualizations',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.getVisualization)
  app.get('/api/visualizations/:uuid', middleware.validateUuidParam, routes.getVisualizationForSourceFile)
  app.get('/api/latest-visualization-date',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.getLatestVisualizationDate
  )
  app.get('/api/sites/:siteid', routes.site)
  app.get('/api/uploaded-metadata', routes.listInstrumentsFromMetadata)
  app.post('/api/collection', express.json(), routes.addCollection)
  app.get('/api/collection/:uuid', middleware.validateUuidParam, routes.getCollection)
  app.post('/api/generate-pid', express.json(), routes.generatePid)

  // private
  app.put('/files/:uuid', routes.putMetadataXml)
  app.get('/metadata/:hash', routes.getMetadata)
  app.get('/metadata', routes.listMetadata)
  app.post('/metadata/:hash', express.json(), routes.updateMetadata)
  app.put('/metadata/:hash', express.json(), routes.uploadMetadata)
  app.put('/visualizations/:filename', express.json(), routes.putVisualization)
  app.post('/model-files/', express.json(), modelRoutes.postModelFiles)
  app.post('/model-files/:uuid', express.json(), modelRoutes.freezeModelFile)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
})()
