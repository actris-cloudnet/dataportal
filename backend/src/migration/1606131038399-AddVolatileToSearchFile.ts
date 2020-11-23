import {MigrationInterface, QueryRunner} from "typeorm";

export class AddVolatileToSearchFile1606131038399 implements MigrationInterface {
    name = 'AddVolatileToSearchFile1606131038399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" ADD "volatile" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "volatile"`);
    }

}
