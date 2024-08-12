import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeophysicalProductType1723450195340 implements MigrationInterface {
  name = "AddGeophysicalProductType1723450195340";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."product_type_enum" RENAME TO "product_type_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."product_type_enum" AS ENUM('instrument', 'model', 'synergetic', 'evaluation', 'experimental', 'geophysical')`,
    );
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "type" TYPE "public"."product_type_enum"[] USING "type"::"text"::"public"."product_type_enum"[]`,
    );
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."product_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."product_type_enum_old" AS ENUM('instrument', 'model', 'synergetic', 'evaluation', 'experimental')`,
    );
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "type" TYPE "public"."product_type_enum_old"[] USING "type"::"text"::"public"."product_type_enum_old"[]`,
    );
    await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "type" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."product_type_enum_old" RENAME TO "product_type_enum"`);
  }
}
