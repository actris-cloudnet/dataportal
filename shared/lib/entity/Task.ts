import { InstrumentInfo } from "./Instrument";
import { Model } from "./Model";

export interface Task {
  id: number;
  type: string;
  status: string;
  siteId: string;
  measurementDate: string;
  productId: string;
  instrumentInfo: InstrumentInfo;
  model: Model;
  scheduledAt: string;
  priority: number;
}
