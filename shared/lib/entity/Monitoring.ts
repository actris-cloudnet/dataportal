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

export interface MonitoringFile {
  uuid: string;
  startDate: string;
  periodType: string;
  createdAt: string;
  updatedAt: string;
  monitoringProduct: MonitoringProduct;
}

export interface MonitoringVisualization {
  s3key: string;
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  sourceFile: MonitoringFile;
  monitoringProductVariable: MonitoringProductVariable;
}
