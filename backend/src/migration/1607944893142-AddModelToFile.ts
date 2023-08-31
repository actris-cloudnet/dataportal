import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelToFile1607944893142 implements MigrationInterface {
  name = "AddModelToFile1607944893142";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" ADD "modelId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_5af5a3b6962dfdb21c85c530e08" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_5af5a3b6962dfdb21c85c530e08"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "modelId"`);
  }
}
