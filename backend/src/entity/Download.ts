import { Column, Entity, PrimaryGeneratedColumn, ViewEntity, ViewColumn } from "typeorm";

export enum ObjectType {
  Product = "product",
  Collection = "collection",
  Raw = "raw",
}

@Entity()
export class Download {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  objectType!: ObjectType;

  @Column("uuid")
  objectUuid!: string;

  @Column()
  ip!: string;

  @Column({ type: "char", length: 2, nullable: true })
  country!: string | null;

  @Column()
  createdAt!: Date;

  constructor(objectType: ObjectType, objectUuid: string, ip: string, country?: string, createdAt = new Date()) {
    this.objectType = objectType;
    this.objectUuid = objectUuid;
    this.ip = ip;
    this.country = country || null;
    this.createdAt = createdAt;
  }
}

@ViewEntity({
  expression: `
    SELECT
      "createdAt"::date AS "downloadDate",
      "ip",
      "country",
      "measurementDate",
      "productType",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, "measurementDate", 'observation' AS "productType", "siteId"
        FROM regular_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT uuid, "measurementDate", 'model' AS "productType", "siteId"
        FROM model_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS file
      GROUP BY uuid, "measurementDate", "productType", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", "measurementDate", 'observation' AS "productType", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT "collectionUuid", "measurementDate", 'model' AS "productType", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productType", "siteId"
    ) object ON "objectUuid" = object.uuid
    WHERE
      ip NOT IN ('', '::ffff:127.0.0.1')
      AND ip NOT LIKE '192.168.%'
      AND ip NOT LIKE '193.166.223.%'
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productType", "siteId"
  `,
  materialized: true,
})
export class DownloadStats {
  @ViewColumn()
  downloadDate!: Date;

  @ViewColumn()
  measurementDate!: Date;

  @ViewColumn()
  productType!: string;

  @ViewColumn()
  siteId!: string;

  @ViewColumn()
  downloads!: number;
}
