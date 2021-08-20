import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUniqueSearchFile1629459426434 implements MigrationInterface {
    name = 'AddUniqueSearchFile1629459426434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" ADD CONSTRAINT "UQ_04b805110f90917f6f029ed506a" UNIQUE ("measurementDate", "siteId", "productId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "UQ_04b805110f90917f6f029ed506a"`);
    }

}
