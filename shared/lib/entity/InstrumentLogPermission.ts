export type InstrumentLogPermissionType = "canReadLogs" | "canWriteLogs";

export interface InstrumentLogPermission {
  id: number;
  permission: InstrumentLogPermissionType;
  instrumentInfoUuid: string | null;
}
