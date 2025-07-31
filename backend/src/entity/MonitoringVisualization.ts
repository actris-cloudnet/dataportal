import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { MonitoringFile } from "./MonitoringFile";
import { MonitoringProductVariable } from "./MonitoringProductVariable";

@Entity()
export class MonitoringVisualization {
  @PrimaryColumn()
  s3key!: string;

  @ManyToOne((_) => MonitoringFile, (file) => file.monitoringVisualizations, { nullable: false })
  sourceFile!: MonitoringFile;

  @ManyToOne((_) => MonitoringProductVariable, (prodVar) => prodVar.monitoringVisualizations, { nullable: false })
  monitoringProductVariable!: MonitoringProductVariable;

  @Column({ type: "smallint", nullable: true })
  width!: number | null;

  @Column({ type: "smallint", nullable: true })
  height!: number | null;

  @Column({ type: "smallint", nullable: true })
  marginTop!: number | null;

  @Column({ type: "smallint", nullable: true })
  marginRight!: number | null;

  @Column({ type: "smallint", nullable: true })
  marginBottom!: number | null;

  @Column({ type: "smallint", nullable: true })
  marginLeft!: number | null;

}
