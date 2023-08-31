import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConstraints1680258708088 implements MigrationInterface {
  name = "UpdateConstraints1680258708088";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_5f45a6795d6bbc34540801085ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07"`,
    );
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7"`);
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124"`);
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_fc1db9abc3afe5807779bc56243"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_27fd775d0627f97133310c77d04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_5f45a6795d6bbc34540801085ba" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0" FOREIGN KEY ("modelCitationId") REFERENCES "model_citation"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f" FOREIGN KEY ("regularCitationId") REFERENCES "regular_citation"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_fc1db9abc3afe5807779bc56243" FOREIGN KEY ("regularFileUuid") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_27fd775d0627f97133310c77d04" FOREIGN KEY ("modelFileUuid") REFERENCES "model_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_27fd775d0627f97133310c77d04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" DROP CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_fc1db9abc3afe5807779bc56243"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4"`,
    );
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124"`);
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7"`);
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_5f45a6795d6bbc34540801085ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_694ee45a95d4b031ff9776cbe81" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_model_files_model_file" ADD CONSTRAINT "FK_27fd775d0627f97133310c77d04" FOREIGN KEY ("modelFileUuid") REFERENCES "model_file"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_fc1db9abc3afe5807779bc56243" FOREIGN KEY ("regularFileUuid") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f" FOREIGN KEY ("regularCitationId") REFERENCES "regular_citation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_5f45a6795d6bbc34540801085ba" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0" FOREIGN KEY ("modelCitationId") REFERENCES "model_citation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
