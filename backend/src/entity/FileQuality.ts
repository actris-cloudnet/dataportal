import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { QualityReport } from "./QualityReport";

export enum ErrorLevel {
  PASS = "pass",
  INFO = "info",
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

  @Column({ type: "smallint", default: 0 })
  tests!: number;

  @Column({ type: "smallint", default: 0 })
  errors!: number;

  @Column({ type: "smallint", default: 0 })
  warnings!: number;

  @Column({ type: "smallint", default: 0 })
  info!: number;

  @OneToMany(() => QualityReport, (report) => report.quality)
  testReports!: QualityReport[];
}
