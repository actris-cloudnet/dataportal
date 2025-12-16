import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { MonitoringProductVariable } from "./MonitoringProductVariable";
import { Instrument } from "./Instrument";

@Entity()
export class MonitoringProduct {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @OneToMany(() => MonitoringProductVariable, (monProdVar) => monProdVar.monitoringProduct)
  monitoringVariables!: MonitoringProductVariable[];

  @ManyToMany(() => Instrument, (instrument) => instrument.derivedMonitoringProducts)
  sourceInstruments!: Instrument[];
}
