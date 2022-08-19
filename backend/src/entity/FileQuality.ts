import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { QualityReport } from "./QualityReport";

export enum ErrorLevel {
  PASS = "pass",
  WARNING = "warning",
  ERROR = "error",
}

@Entity()
export class FileQuality {
  @PrimaryColumn("uuid")
  uuid!: string;

  @Column({
    type: "enum",
    enum: ErrorLevel,
  })
  errorLevel!: ErrorLevel;

  @Column({ type: "text" })
  qcVersion!: string;

  @Column()
  timestamp!: Date;

  @Column({ type: "smallint", nullable: true })
  tests!: number | null;

  @Column({ type: "smallint", nullable: true })
  errors!: number | null;

  @Column({ type: "smallint", nullable: true })
  warnings!: number | null;

  @OneToMany(() => QualityReport, (report) => report.quality)
  testReports!: QualityReport[];
}
