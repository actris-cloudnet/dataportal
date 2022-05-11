import 'reflect-metadata'
import {createConnection} from 'typeorm'
import * as express from 'express'
import {ErrorRequestHandler} from 'express'
import * as basicAuth from 'express-basic-auth'
import {RequestError} from './entity/RequestError'
import {stringify, getIpLookup} from './lib'
import {Middleware} from './lib/middleware'
import {FileRoutes} from './routes/file'
import {SiteRoutes} from './routes/site'
import {CollectionRoutes} from './routes/collection'
import {UploadRoutes} from './routes/upload'
import {VisualizationRoutes} from './routes/visualization'
import {InstrumentRoutes} from './routes/instrument'
import {ProductRoutes} from './routes/product'
import {ModelRoutes} from './routes/model'
import {DownloadRoutes} from './routes/download'
import {CalibrationRoutes} from './routes/calibration'
import {QualityReportRoutes} from './routes/qualityreport'
import {SiteContactRoutes} from './routes/siteContact'
import {UserAccountRoutes} from './routes/userAccount'
import env from './lib/env'
import {Authenticator, Authorizator} from './lib/auth'

(async function() {
  const port = 3000
  const app = express()

  const conn = await createConnection()
  const ipLookup = await getIpLookup({ watchForUpdates: true })
  const middleware = new Middleware(conn)

  const authenticator = new Authenticator(conn)
  const authorizator = new Authorizator(conn)


  const fileRoutes = new FileRoutes(conn)
  const siteRoutes = new SiteRoutes(conn)
  const prodRoutes = new ProductRoutes(conn)
  const instrRoutes = new InstrumentRoutes(conn)
  const vizRoutes = new VisualizationRoutes(conn, fileRoutes)
  const uploadRoutes = new UploadRoutes(conn)
  const collRoutes = new CollectionRoutes(conn)
  const modelRoutes = new ModelRoutes(conn)
  const dlRoutes = new DownloadRoutes(conn, fileRoutes, collRoutes, uploadRoutes, ipLookup)
  const calibRoutes = new CalibrationRoutes(conn)
  const qualityRoutes = new QualityReportRoutes(conn, fileRoutes)

  const siteContactRoutes = new SiteContactRoutes(conn)
  const userAccountRoutes = new UserAccountRoutes(conn)

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

  let authMiddleware = basicAuth({
    users: { 'admin': env.STATS_PASSWORD },
    challenge: true,
  })

  if (process.env.NODE_ENV != 'production') {
    app.use(function(_req, res, next) {
      res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
      res.header('Access-Control-Allow-Credentials', 'true')
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
  app.get('/api/model-files',
    middleware.filesValidator,
    middleware.modelFilesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.modelFiles)
  app.get('/api/files/:uuid', middleware.validateUuidParam, fileRoutes.file)
  app.get('/api/sites', siteRoutes.sites)
  app.get('/api/sites/:siteid', siteRoutes.site)
  app.get('/api/products', prodRoutes.products)
  app.get('/api/instruments', instrRoutes.instruments)
  app.get('/api/models', modelRoutes.models)
  app.get('/api/products/variables', prodRoutes.productVariables)
  app.get('/api/visualizations',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizRoutes.visualization)
  app.get('/api/visualizations/:uuid', middleware.validateUuidParam, vizRoutes.visualizationForSourceFile)
  app.get('/api/calibration', calibRoutes.calibration)
  app.get('/api/raw-files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    uploadRoutes.listMetadata(false))
  app.get('/api/raw-model-files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    uploadRoutes.listMetadata(false))


  // public/internal
  app.get('/api/uploaded-metadata', uploadRoutes.listInstrumentsFromMetadata)
  app.post('/api/collection', express.json({limit: '1mb'}), collRoutes.postCollection)
  app.get('/api/collection/:uuid', middleware.validateUuidParam, collRoutes.collection)
  app.post('/api/generate-pid', express.json(), collRoutes.generatePid)
  app.get('/api/download/product/:uuid/*', middleware.validateUuidParam, dlRoutes.product)
  app.get('/api/download/raw/:uuid/*', middleware.validateUuidParam, dlRoutes.raw)
  app.get('/api/download/collection/:uuid', middleware.validateUuidParam, dlRoutes.collection)
  app.get('/api/download/image/*', dlRoutes.image)
  app.get('/api/quality/:uuid', qualityRoutes.qualityReport)

  // protected (for sites)
  app.post('/upload/metadata',
    authenticator.middleware,
    authorizator.uploadMiddleware,
    middleware.getSiteNameFromAuth,// Remove this when auth mw is ready
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
    authenticator.middleware,
    authorizator.modelUploadMiddleware,
    express.json(),
    middleware.getSiteNameFromBody, // Remove this when ready
    uploadRoutes.validateMetadata,
    uploadRoutes.postMetadata)
  app.put('/model-upload/data/:checksum',
    authenticator.middleware,
    authorizator.modelUploadMiddleware,
    middleware.validateMD5Param,
    middleware.getSiteNameFromMeta, // Remove this when ready
    express.raw({limit: '1gb'}),
    uploadRoutes.putData)

  // private
  app.put('/files/*', express.json(), fileRoutes.putFile)
  app.post('/files/', express.json(), fileRoutes.postFile)
  app.post('/upload-metadata', express.json(), uploadRoutes.updateMetadata)
  app.get('/upload-metadata', express.json(), uploadRoutes.listMetadata(true))
  app.get('/upload-model-metadata', express.json(), uploadRoutes.listMetadata(true))
  app.post('/calibration', express.json(), calibRoutes.postCalibration)
  app.put('/visualizations/*', express.json(), vizRoutes.putVisualization)
  app.get('/upload-dateforsize', uploadRoutes.dateforsize)
  app.get('/file-dateforsize', fileRoutes.dateforsize)
  app.put('/quality/:uuid', express.json(), qualityRoutes.putQualityReport)
  app.get('/api/download/stats', authMiddleware, dlRoutes.stats)
  app.delete('/api/files/:uuid', authMiddleware, middleware.checkDeleteParams, fileRoutes.deleteFile)

  // site contacts private
  app.post('/site-contacts',express.json(),siteContactRoutes.postSiteContact)
  app.get('/site-contacts', siteContactRoutes.getSiteContacts)
  app.put('/site-contacts/:id',express.json(),siteContactRoutes.putSiteContact)
  app.delete('/site-contacts/:id',siteContactRoutes.deleteSiteContact)
  // persons private
  app.get('/persons', siteContactRoutes.getPersons)
  app.put('/persons/:id', express.json(),siteContactRoutes.putPerson)
  app.delete('/persons/:id', siteContactRoutes.deletePerson)
  app.delete('/persons', siteContactRoutes.deletePersons)

  // Private UserAccount and Permission routes
  app.post('/user-accounts',
    express.json(),
    userAccountRoutes.postUserValidateFormat,
    userAccountRoutes.postUserCheckDuplicates,
    userAccountRoutes.postUser)
  app.delete('/user-accounts/:id', userAccountRoutes.deleteUserById)
  app.get('/user-accounts', userAccountRoutes.getAllUsers)
  app.post('/user-accounts/:id/permissions',
    express.json(),
    userAccountRoutes.postPermissionValidate,
    userAccountRoutes.postPermission,
  )
  app.get('/user-accounts/:id/permissions', userAccountRoutes.getPermissions)
  app.delete('/user-accounts/:id/permissions', userAccountRoutes.deletePermissions)

  app.get('/permissions', userAccountRoutes.getAllPermissions)
  app.delete('/permissions', userAccountRoutes.deleteAllUnusedPermissions)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port}!`))
})()
