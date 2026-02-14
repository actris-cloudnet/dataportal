export type InstrumentLogEventType = "calibration" | "maintenance" | "malfunction" | "firmware-update";

export interface InstrumentLog {
  id: number;
  instrumentInfoUuid: string;
  eventType: InstrumentLogEventType;
  date: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss"
  notes: string | null;
  createdAt: string; // ISO datetime
  createdBy: { id: number; username: string | null; fullName: string | null } | null;
}
