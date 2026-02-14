export type InstrumentLogEventType =
  | "calibration"
  | "check"
  | "installation"
  | "maintenance"
  | "malfunction"
  | "note"
  | "removal";

export interface InstrumentLogImage {
  id: number;
  filename: string;
  size: number;
}

export interface InstrumentLog {
  id: number;
  instrumentInfoUuid: string;
  eventType: InstrumentLogEventType;
  detail: string | null;
  result: string | null;
  date: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss"
  endDate: string | null;
  notes: string | null;
  images: InstrumentLogImage[];
  createdAt: string; // ISO datetime
  updatedAt: string | null; // ISO datetime
  createdBy: { id: number; username: string | null; fullName: string | null } | null;
}
