export type InstrumentLogPermissionType = "canReadLogs" | "canWriteLogs";

export interface InstrumentLogPermission {
  permission: InstrumentLogPermissionType;
  instrumentInfoUuid: string | null;
}
