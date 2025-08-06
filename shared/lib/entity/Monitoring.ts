export interface MonitoringProductVariable {
  id: string;
  humanReadableName: string;
  order: number;
}
export interface MonitoringProductVariableWithProductId {
  id: string;
  humanReadableName: string;
  order: number;
  productId: string;
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
  site: Site;
  instrumentInfo: InstrumentInfo;
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

export interface Site {
  id: string;
  humanReadableName: string;
  stationName: string;
  description: string | null;
  type: string[];
  latitude: number;
  longitude: number;
  altitude: number;
  gaw: string;
  wigosId: string;
  dvasId: string;
  actrisId: number;
  country: string;
  countryCode: string;
  countrySubdivisionCode: string | null;
}

export interface InstrumentInfo {
  uuid: string;
  pid: string;
  name: string;
  owners: string[];
  model: string;
  type: string;
  serialNumber: string;
}
