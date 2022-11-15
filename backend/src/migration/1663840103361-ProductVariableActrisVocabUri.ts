import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductVariableActrisVocabUri1663840103361 implements MigrationInterface {
  name = "ProductVariableActrisVocabUri1663840103361";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" ADD "actrisVocabUri" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" DROP COLUMN "actrisVocabUri"`);
  }
}
