export type InstrumentLogEventType = "calibration" | "maintenance" | "malfunction";

export interface InstrumentLog {
  id: number;
  instrumentInfoUuid: string;
  eventType: InstrumentLogEventType;
  date: string; // "YYYY-MM-DD"
  notes: string | null;
  createdAt: string; // ISO datetime
}
