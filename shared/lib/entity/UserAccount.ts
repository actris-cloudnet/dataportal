import type { Permission } from "./Permission";

export interface UserAccount {
  id: number;
  username: string | null;
  fullName: string | null;
  permissions: Permission[];
}
