import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelToPermission1732189647151 implements MigrationInterface {
  name = "AddModelToPermission1732189647151";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "UQ_4324fae3897bceb10a6fa430871"`);
    await queryRunner.query(`ALTER TABLE "permission" ADD "modelId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "UQ_1f4a9124db23741b4033cf00b80" UNIQUE ("permission", "siteId", "modelId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "FK_c06e9057c3d2e2c805f1cad6047" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "FK_c06e9057c3d2e2c805f1cad6047"`);
    await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "UQ_1f4a9124db23741b4033cf00b80"`);
    await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "modelId"`);
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "UQ_4324fae3897bceb10a6fa430871" UNIQUE ("permission", "siteId")`,
    );
  }
}
