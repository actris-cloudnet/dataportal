import {MigrationInterface, QueryRunner} from "typeorm";

export class RenameUpload1604059619977 implements MigrationInterface {
    name = 'RenameUpload1604059619977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "upload_status_enum" AS ENUM('created', 'uploaded', 'processed')`);
        await queryRunner.query(`CREATE TABLE "upload" ("uuid" uuid NOT NULL, "hashSum" character varying(32) NOT NULL, "filename" character varying NOT NULL, "measurementDate" date NOT NULL, "status" "upload_status_enum" NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "instrumentId" character varying, CONSTRAINT "UQ_48edc87d9256941d0176bd4e3cd" UNIQUE ("hashSum"), CONSTRAINT "PK_8c4478cf0c29280ac23906112c7" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "upload" ADD CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "upload" ADD CONSTRAINT "FK_80be44ce92df7874e3abb22b863" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_80be44ce92df7874e3abb22b863"`);
        await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1"`);
        await queryRunner.query(`DROP TABLE "upload"`);
        await queryRunner.query(`DROP TYPE "upload_status_enum"`);
    }

}
