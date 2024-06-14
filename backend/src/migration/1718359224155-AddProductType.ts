import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductType1718359224155 implements MigrationInterface {
  name = "AddProductType1718359224155";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."product_type_enum" AS ENUM('instrument', 'model', 'synergetic', 'evaluation', 'experimental')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "type" "public"."product_type_enum" array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
  }
}
