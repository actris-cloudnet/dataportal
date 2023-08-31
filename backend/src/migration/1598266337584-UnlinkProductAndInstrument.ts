import { MigrationInterface, QueryRunner } from "typeorm";

export class UnlinkProductAndInstrument1598266337584 implements MigrationInterface {
  name = "UnlinkProductAndInstrument1598266337584";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP CONSTRAINT "FK_2cfa7bb87165cc2a842f092890d"`);
    await queryRunner.query(`ALTER TABLE "instrument" RENAME COLUMN "productId" TO "type"`);
    await queryRunner.query(`ALTER TABLE "instrument" ALTER COLUMN "type" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ALTER COLUMN "type" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "instrument" RENAME COLUMN "type" TO "productId"`);
    await queryRunner.query(
      `ALTER TABLE "instrument" ADD CONSTRAINT "FK_2cfa7bb87165cc2a842f092890d" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
