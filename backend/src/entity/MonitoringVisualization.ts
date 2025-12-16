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

  @Column({ type: "smallint", nullable: false })
  width!: number;

  @Column({ type: "smallint", nullable: false })
  height!: number;

  @Column({ type: "smallint", nullable: false })
  marginTop!: number;

  @Column({ type: "smallint", nullable: false })
  marginRight!: number;

  @Column({ type: "smallint", nullable: false })
  marginBottom!: number;

  @Column({ type: "smallint", nullable: false })
  marginLeft!: number;
}
