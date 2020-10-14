import {MigrationInterface, QueryRunner} from "typeorm";

export class RemovePidFromModelFile1602665373593 implements MigrationInterface {
    name = 'RemovePidFromModelFile1602665373593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "pid"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" ADD "pid" character varying NOT NULL DEFAULT ''`);
    }

}
