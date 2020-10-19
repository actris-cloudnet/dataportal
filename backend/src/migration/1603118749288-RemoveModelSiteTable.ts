import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveModelSiteTable1603118749288 implements MigrationInterface {
    name = 'RemoveModelSiteTable1603118749288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
        await queryRunner.query(`ALTER TABLE "site" ADD "isModelOnlySite" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
        await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "isModelOnlySite"`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "model_site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
