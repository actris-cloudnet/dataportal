import type { Site } from "./Site";

export type PermissionType =
  | "canUpload"
  | "canUploadModel"
  | "canCalibrate"
  | "canProcess"
  | "canDelete"
  | "canGetStats"
  | "canAddPublication"
  | "canPublishTask";

export interface Permission {
  id: number;
  permission: PermissionType;
  site: Site | null;
}
