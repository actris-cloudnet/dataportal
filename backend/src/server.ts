import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ErrorRequestHandler } from 'express'
import { RequestError } from './entity/RequestError'
import { stringify } from './lib'
import * as express from 'express'
import config from './config'
import { Middleware } from './lib/middleware'
import * as xmlparser from 'express-xml-bodyparser'
import {FileController} from './routes/file'
import {ProductController} from './routes/product'
import {SiteController} from './routes/site'
import {InstrumentController} from './routes/instrument'
import {VisualizationController} from './routes/visualization'
import {MiscRoutes} from './routes/status'
import {CollectionController} from './routes/collection'
import {UploadController} from './routes/upload'

(async function() {
  const port = parseInt(process.argv[2])
  const app = express()

  app.use(xmlparser())

  const connName = config.connectionName
  const conn = await createConnection(connName)
  const middleware = new Middleware(conn)

  const fileController = new FileController(conn)
  const siteController = new SiteController(conn)
  const prodController = new ProductController(conn)
  const instrController = new InstrumentController(conn)
  const vizController = new VisualizationController(conn, fileController)
  const uploadController = new UploadController(conn)
  const miscRoutes = new MiscRoutes(conn)
  const collController = new CollectionController(conn)

  const errorHandler: ErrorRequestHandler = (err: RequestError, _req, res, next) => {
    console.log(`Error in path ${_req.path}:`, stringify(err))
    console.error(err)
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

    app.get('/allfiles', fileController.allfiles)
    app.get('/allsearch', fileController.allsearch)
    app.get('/allcollections', collController.allcollections)
  }

  // public (changes to these require changes to API docs)
  app.get('/api/search',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileController.getSearch)
  app.get('/api/files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileController.getFiles)
  app.get('/api/files/:uuid', middleware.validateUuidParam, fileController.getFile)
  app.get('/api/sites', siteController.sites)
  app.get('/api/products', prodController.products)
  app.get('/api/instruments', instrController.instruments)

  // public/internal
  app.get('/api/status', miscRoutes.status)
  app.get('/api/products/variables', prodController.productVariables)
  app.get('/api/download/:uuid', middleware.validateUuidParam, collController.download)
  app.get('/api/visualizations',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizController.getVisualization)
  app.get('/api/visualizations/:uuid', middleware.validateUuidParam, vizController.getVisualizationForSourceFile)
  app.get('/api/latest-visualization-date',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizController.getLatestVisualizationDate
  )
  app.get('/api/sites/:siteid', siteController.site)
  app.get('/api/uploaded-metadata', uploadController.listInstrumentsFromMetadata)
  app.post('/api/collection', express.json({limit: '1mb'}), collController.postCollection)
  app.get('/api/collection/:uuid', middleware.validateUuidParam, collController.getCollection)
  app.post('/api/generate-pid', express.json(), collController.generatePid)

  // protected (for sites)
  app.post('/upload/metadata', middleware.getSiteNameFromAuth, express.json(), uploadController.postMetadata)
  app.put('/upload/data/:hashSum',
    middleware.validateMD5Param,
    middleware.getSiteNameFromAuth,
    express.raw({limit: '100gb'}),
    uploadController.putData)
  app.get('/upload/metadata/:hashSum', middleware.validateMD5Param, uploadController.getMetadata)


  // private
  app.put('/files/:uuid', fileController.putFile)
  app.get('/metadata', uploadController.listMetadata)
  app.put('/visualizations/:filename', express.json(), vizController.putVisualization)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
})()
