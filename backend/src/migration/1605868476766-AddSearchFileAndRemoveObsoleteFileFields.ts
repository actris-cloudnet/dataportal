import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSearchFileAndRemoveObsoleteFileFields1605868476766 implements MigrationInterface {
    name = 'AddSearchFileAndRemoveObsoleteFileFields1605868476766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "search_file" ("uuid" uuid NOT NULL, "measurementDate" date NOT NULL, "size" integer NOT NULL, "siteId" character varying, "productId" character varying, CONSTRAINT "PK_7a111a3df8790374cd476849a0f" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "publicity"`);
        await queryRunner.query(`DROP TYPE "public"."file_publicity_enum"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "releasedAt"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "filename"`);
        await queryRunner.query(`ALTER TABLE "file" ADD "version" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file" ADD "createdAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file" ADD "updatedAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "history" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "search_file" ADD CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "search_file" ADD CONSTRAINT "FK_fec04c86fcd20096d881d0e172f" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_fec04c86fcd20096d881d0e172f"`);
        await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4"`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "history" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "file" ADD "filename" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file" ADD "releasedAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."file_publicity_enum" AS ENUM('public', 'nodl', 'hidden')`);
        await queryRunner.query(`ALTER TABLE "file" ADD "publicity" "file_publicity_enum" NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE "file" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "search_file"`);
    }

}
