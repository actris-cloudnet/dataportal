import {MigrationInterface, QueryRunner} from "typeorm";

export class SeparateModelFilesFromInstrumentFiles1612274263557 implements MigrationInterface {
    name = 'SeparateModelFilesFromInstrumentFiles1612274263557'

    public async up(queryRunner: QueryRunner): Promise<void> {
      // MODEL FILE
        await queryRunner.query(`CREATE TABLE "model_file" ("uuid" uuid NOT NULL, "s3key" character varying NOT NULL, "version" character varying NOT NULL, "pid" character varying NOT NULL DEFAULT '', "volatile" boolean NOT NULL DEFAULT true, "legacy" boolean NOT NULL DEFAULT false, "measurementDate" date NOT NULL, "history" character varying NOT NULL DEFAULT '', "checksum" character varying NOT NULL, "size" integer NOT NULL, "format" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "productId" character varying, "modelId" character varying, CONSTRAINT "UQ_c12dee99fecddb342ac1b1c865d" UNIQUE ("checksum"), CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_18bd7d150abecbaa15dad8290c" ON "model_file" ("measurementDate", "siteId", "productId") `);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    // MODEL FILE VISUALIZATION
        await queryRunner.query(`CREATE TABLE "model_visualization" ("s3key" character varying NOT NULL, "sourceFileUuid" uuid, "productVariableId" character varying, CONSTRAINT "PK_f823f103aacdc71693293a1a4b8" PRIMARY KEY ("s3key"))`);
        await queryRunner.query(`ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854" FOREIGN KEY ("sourceFileUuid") REFERENCES "model_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    // COLLECTION
        await queryRunner.query(`CREATE TABLE "collection_model_files_model_file" ("collectionUuid" uuid NOT NULL, "modelFileUuid" uuid NOT NULL, CONSTRAINT "PK_91daea83f0e0b82fe8e4581ab6d" PRIMARY KEY ("collectionUuid", "modelFileUuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_694ee45a95d4b031ff9776cbe8" ON "collection_model_files_model_file" ("collectionUuid") `);
        await queryRunner.query(`CREATE INDEX "IDX_27fd775d0627f97133310c77d0" ON "collection_model_files_model_file" ("modelFileUuid") `);
        await queryRunner.query(`ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_27fd775d0627f97133310c77d04" FOREIGN KEY ("modelFileUuid") REFERENCES "model_file"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
    // RENAME
        await queryRunner.query(`ALTER TABLE "file" RENAME TO "regular_file"`);
        await queryRunner.query(`ALTER TABLE "collection_files_file" RENAME TO "collection_files_regular_file"`);

    // MOVE DATA (CUSTOM)
       await queryRunner.query(`SET session_replication_role = 'replica'`);

       await queryRunner.query(`INSERT INTO model_file SELECT uuid, s3key, version, pid, volatile, legacy, "measurementDate", history, checksum, size, format, "createdAt", "updatedAt", "siteId", "productId", "modelId" FROM regular_file WHERE "productId" = 'model'`);
       await queryRunner.query(`DELETE FROM regular_file WHERE "productId" = 'model'`);

       await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_5af5a3b6962dfdb21c85c530e08"`);
       await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "modelId"`);

       await queryRunner.query(`INSERT INTO collection_model_files_model_file SELECT * FROM collection_files_regular_file WHERE "fileUuid" IN (SELECT uuid FROM model_file)`);
       await queryRunner.query(`DELETE FROM collection_files_regular_file WHERE "fileUuid" IN (SELECT uuid FROM model_file)`);

       await queryRunner.query(`SET session_replication_role = 'origin'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
        await queryRunner.query(`ALTER TABLE "file" ADD "modelId" character varying`);
        await queryRunner.query(`ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_27fd775d0627f97133310c77d04"`);
        await queryRunner.query(`ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81"`);
        await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3"`);
        await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854"`);
        await queryRunner.query(`DROP INDEX "IDX_27fd775d0627f97133310c77d0"`);
        await queryRunner.query(`DROP INDEX "IDX_694ee45a95d4b031ff9776cbe8"`);
        await queryRunner.query(`DROP TABLE "collection_model_files_model_file"`);
        await queryRunner.query(`DROP TABLE "model_visualization"`);
        await queryRunner.query(`DROP INDEX "IDX_18bd7d150abecbaa15dad8290c"`);
        await queryRunner.query(`DROP TABLE "model_file"`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_5af5a3b6962dfdb21c85c530e08" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "regular_file" RENAME TO "file"`);
    }

}
