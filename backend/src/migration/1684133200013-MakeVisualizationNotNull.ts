import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeVisualizationNotNull1684133200013 implements MigrationInterface {
  name = "MakeVisualizationNotNull1684133200013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_a3b021457d018320765db7bc490"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc"`);
    await queryRunner.query(`ALTER TABLE "visualization" ALTER COLUMN "sourceFileUuid" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "visualization" ALTER COLUMN "productVariableId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ALTER COLUMN "sourceFileUuid" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ALTER COLUMN "productVariableId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "visualization" ADD CONSTRAINT "FK_a3b021457d018320765db7bc490" FOREIGN KEY ("sourceFileUuid") REFERENCES "regular_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "visualization" ADD CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854" FOREIGN KEY ("sourceFileUuid") REFERENCES "model_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_a3b021457d018320765db7bc490"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ALTER COLUMN "productVariableId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ALTER COLUMN "sourceFileUuid" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_9afd1b13991bd21a3f4c0d8ead3" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_visualization" ADD CONSTRAINT "FK_c780b15b6f4ec803c7a044d2854" FOREIGN KEY ("sourceFileUuid") REFERENCES "model_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "visualization" ALTER COLUMN "productVariableId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "visualization" ALTER COLUMN "sourceFileUuid" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "visualization" ADD CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "visualization" ADD CONSTRAINT "FK_a3b021457d018320765db7bc490" FOREIGN KEY ("sourceFileUuid") REFERENCES "regular_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
