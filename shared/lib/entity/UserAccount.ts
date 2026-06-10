import type { Permission } from "./Permission";
import type { InstrumentLogPermission } from "./InstrumentLogPermission";
import type { Person } from "./Person";

export interface UserAccount {
  id: number;
  username: string | null;
  person: Person | null;
  permissions: Permission[];
  instrumentLogPermissions: InstrumentLogPermission[];
}
