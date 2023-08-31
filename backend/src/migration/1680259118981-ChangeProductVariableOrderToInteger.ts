import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeProductVariableOrderToInteger1680259118981 implements MigrationInterface {
  name = "ChangeProductVariableOrderToInteger1680259118981";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variable" ALTER COLUMN "order" TYPE smallint USING "order"::smallint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variable" ALTER COLUMN "order" TYPE character varying USING "order"::varchar`,
    );
  }
}
