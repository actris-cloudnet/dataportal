import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductTypeFromEnumToTextArray1745317864788 implements MigrationInterface {
  name = "ProductTypeFromEnumToTextArray1745317864788";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" TYPE text[]`);
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
