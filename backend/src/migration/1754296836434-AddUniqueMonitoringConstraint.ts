import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueMonitoringConstraint1754296836434 implements MigrationInterface {
    name = 'AddUniqueMonitoringConstraint1754296836434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitoring_file" ADD CONSTRAINT "UQ_ab6ee42578592dd25f9c1e93c3f" UNIQUE ("startDate", "periodType", "siteId", "monitoringProductId", "instrumentInfoUuid")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitoring_file" DROP CONSTRAINT "UQ_ab6ee42578592dd25f9c1e93c3f"`);
    }

}
