import {MigrationInterface, QueryRunner} from "typeorm";

export class AddProductTable1585731157490 implements MigrationInterface {
    name = 'AddProductTable1585731157490'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "product" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, "level" character varying NOT NULL, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "product"`, undefined);
        await queryRunner.query(`DROP TYPE "public"."file_product_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "level"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD "productId" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "productId"`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD "level" integer NOT NULL`, undefined);
        await queryRunner.query(`CREATE TYPE "public"."file_product_enum" AS ENUM('categorize', 'classification', 'drizzle', 'iwc', 'lidar', 'lwc', 'model', 'mwr', 'radar')`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ADD "product" "file_product_enum" NOT NULL`, undefined);
        await queryRunner.query(`DROP TABLE "product"`, undefined);
    }

}
