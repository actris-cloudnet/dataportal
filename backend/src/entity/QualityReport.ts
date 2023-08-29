import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { FileQuality } from "./FileQuality";

export enum ErrorLevel {
  PASS = "pass",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

@Entity()
export class QualityReport {
  @PrimaryColumn({ type: "text" })
  testId!: string;

  @Column({
    type: "enum",
    enum: ErrorLevel,
  })
  result!: ErrorLevel;

  @Column({ type: "jsonb", nullable: true })
  exceptions!: any;

  @PrimaryColumn()
  qualityUuid!: string;

  @ManyToOne(() => FileQuality, (quality) => quality.testReports, { onDelete: "CASCADE" })
  quality!: FileQuality;
}
