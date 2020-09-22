import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSourceFileIds1600084251764 implements MigrationInterface {
    name = 'AddSourceFileIds1600084251764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" ADD "sourceFileIds" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "sourceFileIds"`);
    }

}
