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
      "productId",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, "measurementDate", "productId", "siteId"
        FROM regular_file
        UNION ALL
        SELECT uuid, "measurementDate", "productId", "siteId"
        FROM model_file
      ) AS file
      GROUP BY uuid, "measurementDate", "productId", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", "measurementDate", "productId", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        UNION ALL
        SELECT "collectionUuid", "measurementDate", "productId", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productId", "siteId"
    ) object ON "objectUuid" = object.uuid
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productId", "siteId"
  `,
  materialized: true,
})
export class DownloadStats {
  @ViewColumn()
  downloadDate!: Date;

  @ViewColumn()
  measurementDate!: Date;

  @ViewColumn()
  productId!: string;

  @ViewColumn()
  siteId!: string;

  @ViewColumn()
  downloads!: number;
}
