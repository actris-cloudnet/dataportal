import {MigrationInterface, QueryRunner} from "typeorm";

export class AddModelSiteOnlyFlag1604412465263 implements MigrationInterface {
    name = 'AddModelSiteOnlyFlag1604412465263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" ADD "isModelOnlySite" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "isModelOnlySite"`);
    }

}
