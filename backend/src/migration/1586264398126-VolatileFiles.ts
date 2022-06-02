import { MigrationInterface, QueryRunner } from "typeorm";

export class VolatileFiles1586264398126 implements MigrationInterface {
  name = "VolatileFiles1586264398126";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "releasedAt" DROP DEFAULT`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "releasedAt" SET DEFAULT now()`, undefined);
  }
}
