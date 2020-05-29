import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPidAndVolatileColumnsForFile1589959115622 implements MigrationInterface {
    name = 'AddPidAndVolatileColumnsForFile1589959115622'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" ADD "pid" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD "volatile" boolean NOT NULL DEFAULT true`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "volatile"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "pid"`, undefined);
    }

}
