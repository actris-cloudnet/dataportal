import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDvasId1634286258680 implements MigrationInterface {
    name = 'AddDvasId1634286258680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" ADD "dvasId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasId"`);
    }

}
