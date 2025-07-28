import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { MonitoringVisualization } from "./MonitoringVisualization";
import { MonitoringProduct } from "./MonitoringProduct";

@Entity()
export class MonitoringProductVariable {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column({ type: "smallint" })
  order!: number;

  @OneToMany((_) => MonitoringVisualization, (viz) => viz.monitoringProductVariable)
  monitoringVisualizations!: MonitoringVisualization[];

  @ManyToOne((_) => MonitoringProduct, (prod) => prod.monitoringVariables, { nullable: false })
  monitoringProduct!: MonitoringProduct;

}
