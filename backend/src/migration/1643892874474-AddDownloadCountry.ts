import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDownloadCountry1643892874474 implements MigrationInterface {
    name = 'AddDownloadCountry1643892874474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "download" ADD "country" character(2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "download" DROP COLUMN "country"`);
    }

}
