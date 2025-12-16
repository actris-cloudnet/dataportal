import { MigrationInterface, QueryRunner } from "typeorm";

export class MonitoringFileDefaultUuid1755864067335 implements MigrationInterface {
  name = "MonitoringFileDefaultUuid1755864067335";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" DROP CONSTRAINT "FK_9aaefbae94b2a460e119540a453"`);
    await queryRunner.query(`ALTER TABLE "monitoring_file" ALTER COLUMN "uuid" SET DEFAULT uuid_generate_v4()`);
    await queryRunner.query(
      `ALTER TABLE "monitoring_visualization" ADD CONSTRAINT "FK_9aaefbae94b2a460e119540a453" FOREIGN KEY ("sourceFileUuid") REFERENCES "monitoring_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" DROP CONSTRAINT "FK_9aaefbae94b2a460e119540a453"`);
    await queryRunner.query(`ALTER TABLE "monitoring_file" ALTER COLUMN "uuid" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "monitoring_visualization" ADD CONSTRAINT "FK_9aaefbae94b2a460e119540a453" FOREIGN KEY ("sourceFileUuid") REFERENCES "monitoring_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
