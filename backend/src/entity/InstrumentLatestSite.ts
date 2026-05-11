import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT DISTINCT ON ("instrumentInfoUuid")
      "instrumentInfoUuid",
      "siteId",
      "measurementDate" AS "latestMeasurementDate"
    FROM instrument_upload
    WHERE "measurementDate" > CURRENT_DATE - 182
    ORDER BY "instrumentInfoUuid", "measurementDate" DESC
  `,
  materialized: true,
})
export class InstrumentLatestSite {
  @ViewColumn()
  instrumentInfoUuid!: string;

  @ViewColumn()
  siteId!: string;

  @ViewColumn()
  latestMeasurementDate!: Date;
}
