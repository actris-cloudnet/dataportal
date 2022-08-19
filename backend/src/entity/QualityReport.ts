import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { FileQuality } from "./FileQuality";

export enum ErrorLevel {
  PASS = "pass",
  WARNING = "warning",
  ERROR = "error",
}

@Entity()
export class QualityReport {
  @PrimaryColumn({ type: "text" })
  testId!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: ErrorLevel,
  })
  result!: ErrorLevel;

  @Column({ type: "jsonb", nullable: true })
  exceptions!: any;

  @ManyToOne(() => FileQuality, (quality) => quality.testReports, { primary: true, onDelete: "CASCADE" })
  quality!: FileQuality;
}
