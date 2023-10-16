import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeActrisVocabUriToActrisName1697435979422 implements MigrationInterface {
  name = "ChangeActrisVocabUriToActrisName1697435979422";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" RENAME COLUMN "actrisVocabUri" TO "actrisName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" RENAME COLUMN "actrisName" TO "actrisVocabUri"`);
  }
}
