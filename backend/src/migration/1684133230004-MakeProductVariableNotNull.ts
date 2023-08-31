import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProductVariableNotNull1684133230004 implements MigrationInterface {
  name = "MakeProductVariableNotNull1684133230004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" DROP CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd"`);
    await queryRunner.query(`ALTER TABLE "product_variable" ALTER COLUMN "productId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "product_variable" ADD CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" DROP CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd"`);
    await queryRunner.query(`ALTER TABLE "product_variable" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "product_variable" ADD CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
