import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPidAndVolatileColumnsForFile1589956029124 implements MigrationInterface {
    name = 'AddPidAndVolatileColumnsForFile1589956029124'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" ADD "pid" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD "volatile" boolean NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "volatile"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "pid"`, undefined);
    }

}
