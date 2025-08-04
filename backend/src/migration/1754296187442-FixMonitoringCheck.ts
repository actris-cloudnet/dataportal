import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMonitoringCheck1754296187442 implements MigrationInterface {
    name = 'FixMonitoringCheck1754296187442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitoring_file" ALTER COLUMN "startDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "monitoring_file" ADD CONSTRAINT "CHK_06158137a1c07e40f676cfb297" CHECK (("periodType" = 'all' AND "startDate" IS NULL) OR ("periodType" != 'all' AND "startDate" IS NOT NULL))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitoring_file" DROP CONSTRAINT "CHK_06158137a1c07e40f676cfb297"`);
        await queryRunner.query(`ALTER TABLE "monitoring_file" ALTER COLUMN "startDate" SET NOT NULL`);
    }

}
