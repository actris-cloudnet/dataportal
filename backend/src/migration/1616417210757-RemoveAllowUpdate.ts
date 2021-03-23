import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveAllowUpdate1616417210757 implements MigrationInterface {
    name = 'RemoveAllowUpdate1616417210757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "allowUpdate"`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "allowUpdate"`);
        await queryRunner.query(`ALTER TABLE "model_upload" DROP COLUMN "allowUpdate"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_upload" ADD "allowUpdate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "allowUpdate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "upload" ADD "allowUpdate" boolean NOT NULL DEFAULT false`);
    }

}
