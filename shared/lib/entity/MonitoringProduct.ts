export interface MonitoringProductVariable {
  id: string;
  humanReadableName: string;
  order: number;
}
export interface MonitoringProduct {
  id: string;
  humanReadableName: string;
  variables: MonitoringProductVariable[];
}
