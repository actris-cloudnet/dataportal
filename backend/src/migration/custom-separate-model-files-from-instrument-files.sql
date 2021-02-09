SET session_replication_role = 'replica';

INSERT INTO model_file SELECT uuid, s3key, version, pid, volatile, legacy, "measurementDate", history, "cloudnetpyVersion", checksum, size, format, "sourceFileIds", "createdAt", "updatedAt", "siteId", "productId", "modelId" FROM file WHERE "productId" = 'model';
INSERT INTO model_visualization SELECT * FROM visualization WHERE "sourceFileUuid" IN (SELECT uuid FROM model_file);
DELETE FROM visualization WHERE "sourceFileUuid" IN (SELECT uuid FROM model_file);
DELETE FROM file WHERE "productId" = 'model';

ALTER TABLE "file" DROP CONSTRAINT "FK_5af5a3b6962dfdb21c85c530e08";
ALTER TABLE "file" DROP COLUMN "modelId";
ALTER TABLE "file" RENAME TO "regular_file";

INSERT INTO collection_model_files_model_file SELECT * FROM collection_files_file WHERE "fileUuid" IN (SELECT uuid FROM model_file);
DELETE FROM collection_files_file WHERE "fileUuid" IN (SELECT uuid FROM model_file);

SET session_replication_role = 'origin';