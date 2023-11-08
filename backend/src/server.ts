import * as express from "express";
import { ErrorRequestHandler } from "express";
import { RequestError } from "./entity/RequestError";
import { getIpLookup } from "./lib";
import { Middleware } from "./lib/middleware";
import { FileRoutes } from "./routes/file";
import { SiteRoutes } from "./routes/site";
import { CollectionRoutes } from "./routes/collection";
import { UploadRoutes } from "./routes/upload";
import { VisualizationRoutes } from "./routes/visualization";
import { InstrumentRoutes } from "./routes/instrument";
import { ProductRoutes } from "./routes/product";
import { ModelRoutes } from "./routes/model";
import { DownloadRoutes } from "./routes/download";
import { CalibrationRoutes } from "./routes/calibration";
import { QualityReportRoutes } from "./routes/qualityreport";
import { SiteContactRoutes } from "./routes/siteContact";
import { UserAccountRoutes } from "./routes/userAccount";
import { PublicationRoutes } from "./routes/publication";
import { Authenticator, Authorizator } from "./lib/auth";
import { PermissionType } from "./entity/Permission";
import { UserActivationRoutes } from "./routes/userActivation";
import { ReferenceRoutes } from "./routes/reference";
import * as http from "http";
import { AppDataSource } from "./data-source";

async function createServer(): Promise<void> {
  const port = 3000;
  const app = express();

  await AppDataSource.initialize();
  const ipLookup = await getIpLookup({ watchForUpdates: true });
  const middleware = new Middleware(AppDataSource);

  const authenticator = new Authenticator(AppDataSource);
  const authorizator = new Authorizator(AppDataSource);

  const fileRoutes = new FileRoutes(AppDataSource);
  const siteRoutes = new SiteRoutes(AppDataSource);
  const prodRoutes = new ProductRoutes(AppDataSource);
  const instrRoutes = new InstrumentRoutes(AppDataSource);
  const vizRoutes = new VisualizationRoutes(AppDataSource, fileRoutes);
  const uploadRoutes = new UploadRoutes(AppDataSource);
  const collRoutes = new CollectionRoutes(AppDataSource);
  const modelRoutes = new ModelRoutes(AppDataSource);
  const dlRoutes = new DownloadRoutes(AppDataSource, fileRoutes, collRoutes, uploadRoutes, ipLookup);
  const calibRoutes = new CalibrationRoutes(AppDataSource);
  const qualityRoutes = new QualityReportRoutes(AppDataSource, fileRoutes);
  const publicationRoutes = new PublicationRoutes(AppDataSource);
  const userActivationRoutes = new UserActivationRoutes(AppDataSource);

  const siteContactRoutes = new SiteContactRoutes(AppDataSource);
  const userAccountRoutes = new UserAccountRoutes(AppDataSource);

  const referenceRoutes = new ReferenceRoutes(AppDataSource);

  const errorHandler: ErrorRequestHandler = (err: RequestError, req, res, next) => {
    console.error(
      JSON.stringify({
        req: { method: req.method, url: req.url, body: req.is("json") ? req.body : "[Redacted]" },
        err,
      }),
    );
    if (!res.headersSent) {
      delete err.params;
      const status = err.status || 500;
      res.status(status);
      if (err.plaintext) {
        res.send(err.errors);
      } else {
        res.send(err);
      }
    }
    next();
  };

  const errorAsPlaintext: ErrorRequestHandler = (err: RequestError | Error, _req, res, next) => {
    if (!(err instanceof Error)) {
      err.plaintext = true;
    }
    next(err);
  };

  app.set("trust proxy", true);

  if (process.env.NODE_ENV != "production") {
    app.use(function (_req, res, next) {
      res.header("Access-Control-Allow-Origin", "http://localhost:8080");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.get("/allfiles", fileRoutes.allfiles);
    app.get("/allsearch", fileRoutes.allsearch);
    app.get("/allcollections", collRoutes.allcollections);
  }

  // public (changes to these require changes to API docs)
  app.get(
    "/api/search",
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.search,
  );
  app.get(
    "/api/files",
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.files,
  );
  app.get(
    "/api/model-files",
    middleware.filesValidator,
    middleware.modelFilesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    fileRoutes.modelFiles,
  );
  app.get("/api/files/:uuid", middleware.validateUuidParam, fileRoutes.file);
  app.get("/api/files/:uuid/versions", middleware.validateUuidParam, fileRoutes.fileVersions);
  app.get("/api/sites", siteRoutes.sites);
  app.get("/api/sites/:siteId", siteRoutes.site);
  app.get("/api/products", prodRoutes.products);
  app.get("/api/instruments", instrRoutes.instruments);
  app.get("/api/models", modelRoutes.models);
  app.get("/api/products/variables", prodRoutes.productVariables);
  app.get(
    "/api/visualizations",
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    vizRoutes.visualization,
  );
  app.get("/api/visualizations/:uuid", middleware.validateUuidParam, vizRoutes.visualizationForSourceFile);
  app.get("/api/calibration", calibRoutes.validateParams, calibRoutes.calibration);
  app.put(
    "/api/calibration",
    authenticator.verifyCredentials(),
    authorizator.verifyPermission(PermissionType.canCalibrate),
    calibRoutes.validateParams,
    express.json(),
    calibRoutes.putCalibration,
  );
  app.get(
    "/api/raw-files",
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    uploadRoutes.listMetadata(false),
  );
  app.get(
    "/api/raw-model-files",
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    uploadRoutes.listMetadata(false),
  );

  // public/internal
  app.get("/api/uploaded-metadata", uploadRoutes.listInstrumentsFromMetadata);
  app.post("/api/collection", express.json({ limit: "1mb" }), collRoutes.postCollection);
  app.get("/api/collection/:uuid", middleware.validateUuidParam, collRoutes.collection);
  app.post("/api/generate-pid", express.json(), collRoutes.generatePid);
  app.get("/api/download/product/:uuid/*", middleware.validateUuidParam, dlRoutes.product);
  app.get("/api/download/raw/:uuid/*", middleware.validateUuidParam, dlRoutes.raw);
  app.get("/api/download/collection/:uuid", middleware.validateUuidParam, dlRoutes.collection);
  app.get("/api/download/image/*", dlRoutes.image);
  app.get("/api/quality/:uuid", middleware.validateUuidParam, qualityRoutes.qualityReport);
  app.get("/api/reference/:uuid", middleware.validateUuidParam, referenceRoutes.getReference);
  app.get("/api/sites/:siteId/locations", siteRoutes.locations);
  app.get("/api/sites/:siteId/locations/:date", siteRoutes.location);
  app.get("/api/sites/:siteId/product-availability", siteRoutes.productAvailability);

  // TODO: Depreciated. Needed for now, but in the future these should public
  // and properly documented.
  app.get("/api/upload-dateforsize", uploadRoutes.dateforsize);
  app.get("/api/file-dateforsize", fileRoutes.dateforsize);
  app.get("/api/upload-metadata", express.json(), uploadRoutes.listMetadata(true));
  app.get("/api/upload-model-metadata", express.json(), uploadRoutes.listMetadata(true));

  app.get("/upload/metadata/:checksum", middleware.validateMD5Param, uploadRoutes.metadata, errorAsPlaintext);

  app.post(
    "/upload/metadata",
    authenticator.verifyCredentials(),
    express.json(),
    authorizator.verifySite,
    authorizator.verifyPermission(PermissionType.canUpload),
    uploadRoutes.validateMetadata,
    uploadRoutes.validateFilename,
    uploadRoutes.postMetadata,
    errorAsPlaintext,
  );
  app.put(
    "/upload/data/:checksum",
    middleware.validateMD5Param,
    authenticator.verifyCredentials(),
    authorizator.findSiteFromChecksum,
    authorizator.verifyPermission(PermissionType.canUpload),
    express.raw({ limit: "100gb" }),
    uploadRoutes.putData,
    errorAsPlaintext,
  );

  // model data upload (for Ewan only)
  app.post(
    "/model-upload/metadata",
    authenticator.verifyCredentials(),
    express.json(),
    authorizator.verifySite,
    authorizator.verifyPermission(PermissionType.canUploadModel),
    uploadRoutes.validateMetadata,
    uploadRoutes.validateFilename,
    uploadRoutes.postMetadata,
  );

  app.put(
    "/model-upload/data/:checksum",
    middleware.validateMD5Param,
    authenticator.verifyCredentials(),
    authorizator.findSiteFromChecksum,
    authorizator.verifyPermission(PermissionType.canUploadModel),
    express.raw({ limit: "1gb" }),
    uploadRoutes.putData,
  );

  app.get("/credentials/:token", userActivationRoutes.get);
  app.post("/credentials/:token", userActivationRoutes.post);

  // private
  app.put("/files/*", express.json(), fileRoutes.putFile);
  app.post("/files/", express.json(), fileRoutes.postFile);
  app.post("/upload-metadata", express.json(), uploadRoutes.updateMetadata);
  app.get("/upload-metadata", express.json(), uploadRoutes.listMetadata(true));
  app.get("/upload-model-metadata", express.json(), uploadRoutes.listMetadata(true));
  app.put("/visualizations/*", express.json(), vizRoutes.putVisualization);
  app.put("/quality/:uuid", middleware.validateUuidParam, express.json(), qualityRoutes.putQualityReport);
  app.get(
    "/api/download/stats",
    authenticator.verifyCredentials("View download statistics"),
    authorizator.verifyPermission(PermissionType.canGetStats),
    dlRoutes.stats,
  );
  app.delete(
    "/api/files/:uuid",
    middleware.validateUuidParam,
    authenticator.verifyCredentials(),
    middleware.checkDeleteParams,
    authorizator.verifyPermission(PermissionType.canDelete),
    fileRoutes.deleteFile,
  );
  app.post(
    "/api/publications/",
    authenticator.verifyCredentials(),
    authorizator.verifyPermission(PermissionType.canAddPublication),
    publicationRoutes.postPublication,
  );
  app.get("/api/publications/", publicationRoutes.getPublications);

  // site contacts private
  app.post("/site-contacts", express.json(), siteContactRoutes.postSiteContact);
  app.get("/site-contacts", siteContactRoutes.getSiteContacts);
  app.put("/site-contacts/:id", express.json(), siteContactRoutes.putSiteContact);
  app.delete("/site-contacts/:id", siteContactRoutes.deleteSiteContact);
  // persons private
  app.get("/persons", siteContactRoutes.getPersons);
  app.put("/persons/:id", express.json(), siteContactRoutes.putPerson);
  app.delete("/persons/:id", siteContactRoutes.deletePerson);
  app.delete("/persons", siteContactRoutes.deletePersons);

  app.get("/contacts", siteContactRoutes.getContacts);

  // Private UserAccount and Permission routes
  app.post("/user-accounts", express.json(), userAccountRoutes.validatePost, userAccountRoutes.postUserAccount);
  app.get("/user-accounts/:id", userAccountRoutes.getUserAccount);
  app.delete("/user-accounts/:id", userAccountRoutes.deleteUserAccount);
  app.put("/user-accounts/:id", express.json(), userAccountRoutes.validatePut, userAccountRoutes.putUserAccount);
  app.get("/user-accounts/", userAccountRoutes.getAllUserAccounts);

  app.use(errorHandler);

  const server = http.createServer(app);
  // Explicitly set timeout to default value of Node 15 because newer Node
  // versions use a different value. Using 0 (i.e. no timeout) shouldn't be a
  // problem because we're running behind a reverse proxy.
  server.requestTimeout = 0;
  server.listen(port, () => console.log(`App listening on port ${port}!`));

  return new Promise((resolve, reject) => {
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server...");
      server.close(() => {
        console.log("HTTP server closed. Now closing database connection...");
        AppDataSource.destroy().then(
          () => {
            console.log("Database connection closed.");
            resolve();
          },
          (err) => {
            console.error("Failed to close database connection:", err);
            reject(err);
          },
        );
      });
    });
  });
}

createServer()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(`Fatal error: ${err}`);
    process.exit(1);
  });
