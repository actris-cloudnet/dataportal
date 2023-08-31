import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkProductToUploadedMetadata1597388016923 implements MigrationInterface {
  name = "LinkProductToUploadedMetadata1597388016923";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "productId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "FK_9f6d6b144479cf5a8efba43e7e1" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "FK_9f6d6b144479cf5a8efba43e7e1"`);
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "productId"`);
  }
}
