import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMiscUpload1624874560716 implements MigrationInterface {
    name = 'AddMiscUpload1624874560716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "misc_upload_status_enum" AS ENUM('created', 'uploaded', 'processed')`);
        await queryRunner.query(`CREATE TABLE "misc_upload" ("uuid" uuid NOT NULL, "checksum" character varying(32) NOT NULL, "filename" character varying NOT NULL, "measurementDate" date NOT NULL, "size" bigint NOT NULL DEFAULT '0', "status" "misc_upload_status_enum" NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "instrumentId" character varying, CONSTRAINT "UQ_99f80376751ecbc18b658b38bda" UNIQUE ("checksum"), CONSTRAINT "PK_6b0d2e9e249b032d9aa259cae58" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "instrument" ADD "auxiliary" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ADD CONSTRAINT "FK_23a6d85d68e4902c1769ef37c7e" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ADD CONSTRAINT "FK_5323ce07f1dd1b0483e55dc32b5" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "misc_upload" DROP CONSTRAINT "FK_5323ce07f1dd1b0483e55dc32b5"`);
        await queryRunner.query(`ALTER TABLE "misc_upload" DROP CONSTRAINT "FK_23a6d85d68e4902c1769ef37c7e"`);
        await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "auxiliary"`);
        await queryRunner.query(`DROP TABLE "misc_upload"`);
        await queryRunner.query(`DROP TYPE "misc_upload_status_enum"`);
    }

}
