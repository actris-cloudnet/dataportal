import {MigrationInterface, QueryRunner} from 'typeorm'

export class InitialMigration1585729791379 implements MigrationInterface {
    name = 'InitialMigration1585729791379'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "site" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "altitude" integer NOT NULL, "gaw" character varying NOT NULL, "country" character varying NOT NULL, CONSTRAINT "PK_635c0eeabda8862d5b0237b42b4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TYPE "file_publicity_enum" AS ENUM('public', 'nodl', 'hidden')`, undefined);
        await queryRunner.query(`CREATE TYPE "file_product_enum" AS ENUM('categorize', 'classification', 'drizzle', 'iwc', 'lidar', 'lwc', 'model', 'mwr', 'radar')`, undefined);
        await queryRunner.query(`CREATE TABLE "file" ("uuid" uuid NOT NULL, "title" character varying NOT NULL, "measurementDate" date NOT NULL, "history" character varying NOT NULL, "publicity" "file_publicity_enum" NOT NULL DEFAULT 'public', "product" "file_product_enum" NOT NULL, "cloudnetpyVersion" character varying, "releasedAt" TIMESTAMP NOT NULL DEFAULT now(), "filename" character varying NOT NULL, "checksum" character varying NOT NULL, "size" integer NOT NULL, "format" character varying NOT NULL, "level" integer NOT NULL, "siteId" character varying, CONSTRAINT "PK_d85c96c207a7395158a68ee1265" PRIMARY KEY ("uuid"))`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d"`, undefined);
        await queryRunner.query(`DROP TABLE "file"`, undefined);
        await queryRunner.query(`DROP TYPE "file_product_enum"`, undefined);
        await queryRunner.query(`DROP TYPE "file_publicity_enum"`, undefined);
        await queryRunner.query(`DROP TABLE "site"`, undefined);
    }

}