import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceProductWithInstrumentInUploadedMetadata1598263369387 implements MigrationInterface {
  name = "ReplaceProductWithInstrumentInUploadedMetadata1598263369387";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "FK_9f6d6b144479cf5a8efba43e7e1"`);
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" RENAME COLUMN "productId" TO "instrumentId"`);
    await queryRunner.query(
      `ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "FK_90121d7c97a1a3afc9fc42b69e2" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "FK_90121d7c97a1a3afc9fc42b69e2"`);
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" RENAME COLUMN "instrumentId" TO "productId"`);
    await queryRunner.query(
      `ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "FK_9f6d6b144479cf5a8efba43e7e1" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
