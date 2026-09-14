import { ManyToOne, ViewColumn, ViewEntity } from "typeorm";
import { InstrumentInfo } from "./Instrument";
import { Site } from "./Site";

@ViewEntity({
  expression: `
    SELECT instrument_info.uuid AS "instrumentInfoUuid",
      "siteId",
      MAX(instrument_upload."measurementDate") AS "measurementDate"
    FROM instrument_info
    JOIN instrument_upload ON instrument_upload."instrumentInfoUuid" = instrument_info.uuid
    WHERE instrument_upload.status IN ('uploaded', 'processed')
    GROUP BY "siteId", instrument_info.uuid
  `,
  materialized: true,
})
export class InstrumentLatestUpload {
  @ViewColumn()
  instrumentInfoUuid!: string;

  @ManyToOne((_) => InstrumentInfo)
  instrumentInfo!: InstrumentInfo;

  @ViewColumn()
  siteId!: string;

  @ManyToOne((_) => Site)
  site!: Site;

  @ViewColumn()
  measurementDate!: Date;
}
