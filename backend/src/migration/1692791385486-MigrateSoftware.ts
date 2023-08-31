import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateSoftware1692791385486 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO software (code, version)
       SELECT DISTINCT 'cloudnet-processing', "processingVersion"
       FROM regular_file
       WHERE "processingVersion" != ''
       UNION
       SELECT DISTINCT 'cloudnet-processing', "processingVersion"
       FROM model_file
       WHERE "processingVersion" != ''
       UNION
       SELECT DISTINCT 'cloudnetpy', "cloudnetpyVersion"
       FROM regular_file
       WHERE "cloudnetpyVersion" != '' AND "cloudnetpyVersion" NOT LIKE 'Custom%'
       UNION
       SELECT DISTINCT 'custom-cloudnetpy', substring("cloudnetpyVersion", '\\((.+)\\)')
       FROM regular_file
       WHERE "cloudnetpyVersion" != '' AND "cloudnetpyVersion" LIKE 'Custom%'`,
    );
    await queryRunner.query(
      `INSERT INTO regular_file_software_software ("regularFileUuid", "softwareId")
       SELECT regular_file.uuid, software.id
       FROM regular_file
       JOIN software on software.code = 'cloudnetpy' AND software.version = "cloudnetpyVersion"
       WHERE "cloudnetpyVersion" != '' AND "cloudnetpyVersion" NOT LIKE 'Custom%'
       UNION
       SELECT regular_file.uuid, software.id
       FROM regular_file
       JOIN software on software.code = 'custom-cloudnetpy' AND software.version = substring("cloudnetpyVersion", '\\((.+)\\)')
       WHERE "cloudnetpyVersion" != '' AND "cloudnetpyVersion" LIKE 'Custom%'
       UNION
       SELECT regular_file.uuid, software.id
       FROM regular_file
       JOIN software on software.code = 'cloudnet-processing' AND software.version = "processingVersion"
       WHERE "processingVersion" != ''`,
    );
    await queryRunner.query(
      `INSERT INTO model_file_software_software ("modelFileUuid", "softwareId")
       SELECT model_file.uuid, software.id
       FROM model_file
       JOIN software on software.code = 'cloudnet-processing' AND software.version = "processingVersion"
       WHERE "processingVersion" != ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
