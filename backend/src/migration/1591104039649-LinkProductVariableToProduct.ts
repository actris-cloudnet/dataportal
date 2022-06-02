import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkProductVariableToProduct1591104039649 implements MigrationInterface {
  name = "LinkProductVariableToProduct1591104039649";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "product_variable" ADD "productId" character varying`, undefined);
    await queryRunner.query(
      `ALTER TABLE "product_variable" ADD CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "product_variable" DROP CONSTRAINT "FK_629ecd6e1d62f386f99da40dcbd"`,
      undefined
    );
    await queryRunner.query(`ALTER TABLE "product_variable" DROP COLUMN "productId"`, undefined);
  }
}
