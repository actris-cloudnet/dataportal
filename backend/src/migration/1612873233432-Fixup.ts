import {MigrationInterface, QueryRunner} from "typeorm";

export class Fixup1612873233432 implements MigrationInterface {
    name = 'Fixup1612873233432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "regular_file" ("uuid" uuid NOT NULL, "s3key" character varying NOT NULL, "version" character varying NOT NULL, "pid" character varying NOT NULL DEFAULT '', "volatile" boolean NOT NULL DEFAULT true, "legacy" boolean NOT NULL DEFAULT false, "measurementDate" date NOT NULL, "history" character varying NOT NULL DEFAULT '', "checksum" character varying NOT NULL, "size" integer NOT NULL, "format" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "sourceFileIds" text array, "cloudnetpyVersion" character varying NOT NULL DEFAULT '', "siteId" character varying, "productId" character varying, CONSTRAINT "UQ_db141bebd3f95547fbab4337ec9" UNIQUE ("checksum"), CONSTRAINT "PK_b12c001f45e33e49730d505183b" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71f98800645065d688e3f53644" ON "regular_file" ("measurementDate", "siteId", "productId") `);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "cloudnetpyVersion"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "sourceFileIds"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "cloudnetpyVersion"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "sourceFileIds"`);
        await queryRunner.query(`ALTER TABLE "regular_file" ADD CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "regular_file" ADD CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37"`);
        await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0"`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD "sourceFileIds" text array`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD "cloudnetpyVersion" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "file" ADD "sourceFileIds" text array`);
        await queryRunner.query(`ALTER TABLE "file" ADD "cloudnetpyVersion" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`DROP INDEX "IDX_71f98800645065d688e3f53644"`);
        await queryRunner.query(`DROP TABLE "regular_file"`);
    }

}
