import 'reflect-metadata'
import {createConnection} from 'typeorm'
import * as express from 'express'
import {ErrorRequestHandler} from 'express'
import {RequestError} from './entity/RequestError'
import {stringify} from './lib'
import config from './config'
import {Middleware} from './lib/middleware'
import {MiscRoutes} from './routes/misc'
import {FileRoutes} from './routes/file'
import {SiteRoutes} from './routes/site'
import {CollectionRoutes} from './routes/collection'
import {UploadRoutes} from './routes/upload'
import {VisualizationRoutes} from './routes/visualization'
import {InstrumentRoutes} from './routes/instrument'
import {ProductRoutes} from './routes/product'
import {ModelRoutes} from './routes/model'
import {DownloadRoutes} from './routes/download'

(async function() {
  const port = config.port
  const app = express()

  const connName = config.connectionName
  const conn = await createConnection(connName)
  const middleware = new Middleware(conn)

  const fileRoutes = new FileRoutes(conn)
  const siteRoutes = new SiteRoutes(conn)
  const prodRoutes = new ProductRoutes(conn)
  const instrRoutes = new InstrumentRoutes(conn)
  const vizRoutes = new VisualizationRoutes(conn, fileRoutes)
  const uploadRoutes = new UploadRoutes(conn)
  const miscRoutes = new MiscRoutes(conn)
  const collRoutes = new CollectionRoutes(conn)
  const modelRoutes = new ModelRoutes(conn)
  const dlRoutes = new DownloadRoutes(conn)

  const errorHandler: ErrorRequestHandler = (err: RequestError, req, res, next) => {
    if (err.status < 500) console.log(`Error ${err.status} in ${req.method} ${req.path}:`, stringify(err)) // Client error
    else console.error(`Error ${err.status} in ${req.method} ${req.path}:`, err.errors) // Might be anything
    if (!res.headersSent) {
      delete err.params
      const status = err.status || 500
      res.status(status)
      if (err.plaintext) {
        res.send(err.errors)
      } else {
        res.send(err)
      }
    }
    next()
  }

  const errorAsPlaintext: ErrorRequestHandler = (err: RequestError | Error, _req, res, next) => {
    if (!(err instanceof Error)) {
      err.plaintext = true
    }
    next(err)
  }

  if (process.env.NODE_ENV != 'production') {
    app.use(function(_req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    app.get('/allfiles', fileRoutes.allfiles)
    app.get('/allsearch', fileRoutes.allsearch)
    app.get('/allcollections', collRoutes.allcollections)
  }

  // public (changes to these require changes to API docs)
  app.get('/api/search',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.search)
  app.get('/api/files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.files)
  app.get('/api/files/:uuid', middleware.validateUuidParam, fileRoutes.file)
  app.get('/api/sites', siteRoutes.sites)
  app.get('/api/sites/:siteid', siteRoutes.site)
  app.get('/api/products', prodRoutes.products)
  app.get('/api/instruments', instrRoutes.instruments)
  app.get('/api/models', modelRoutes.models)

  // public/internal
  app.get('/api/status', miscRoutes.status)
  app.get('/api/products/variables', prodRoutes.productVariables)
  app.get('/api/visualizations',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizRoutes.visualization)
  app.get('/api/visualizations/:uuid', middleware.validateUuidParam, vizRoutes.visualizationForSourceFile)
  app.get('/api/latest-visualization-date',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizRoutes.latestVisualizationDate
  )
  app.get('/api/uploaded-metadata', uploadRoutes.listInstrumentsFromMetadata)
  app.post('/api/collection', express.json({limit: '1mb'}), collRoutes.postCollection)
  app.get('/api/collection/:uuid', middleware.validateUuidParam, collRoutes.collection)
  app.post('/api/generate-pid', express.json(), collRoutes.generatePid)
  app.get('/api/download/product/:uuid/*', middleware.validateUuidParam, dlRoutes.product)
  app.get('/api/download/collection/:uuid', middleware.validateUuidParam, dlRoutes.collection)
  app.get('/api/download/image/*', dlRoutes.image)

  // protected (for sites)
  app.post('/upload/metadata',
    middleware.getSiteNameFromAuth,
    express.json(),
    uploadRoutes.validateMetadata,
    uploadRoutes.postMetadata,
    errorAsPlaintext)
  app.put('/upload/data/:checksum',
    middleware.validateMD5Param,
    middleware.getSiteNameFromAuth,
    express.raw({limit: '100gb'}),
    uploadRoutes.putData,
    errorAsPlaintext)
  app.get('/upload/metadata/:checksum',
    middleware.validateMD5Param,
    uploadRoutes.metadata,
    errorAsPlaintext)

  // model data upload (for Ewan only)
  app.post('/model-upload/metadata',
    express.json(),
    middleware.getSiteNameFromBody,
    uploadRoutes.validateMetadata,
    uploadRoutes.postMetadata)
  app.put('/model-upload/data/:checksum',
    middleware.validateMD5Param,
    middleware.getSiteNameFromMeta,
    express.raw({limit: '1gb'}),
    uploadRoutes.putData)

  // private
  app.put('/files/*', express.json(), fileRoutes.putFile)
  app.post('/files/', express.json(), fileRoutes.postFile)
  app.get('/upload-metadata', uploadRoutes.listMetadata)
  app.post('/upload-metadata', express.json(), uploadRoutes.updateMetadata)
  app.put('/visualizations/*', express.json(), vizRoutes.putVisualization)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
})()
