import type { Permission } from "./Permission";
import type { InstrumentLogPermission } from "./InstrumentLogPermission";

export interface UserAccount {
  id: number;
  username: string | null;
  fullName: string | null;
  permissions: Permission[];
  instrumentLogPermissions: InstrumentLogPermission[];
}
