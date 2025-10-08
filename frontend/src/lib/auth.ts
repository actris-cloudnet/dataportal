import axios from "axios";
import { computed, reactive } from "vue";
import { backendUrl } from ".";
import type { Permission, PermissionType } from "@shared/entity/Permission";
// import type { UserAccount } from "@shared/entity/UserAccount";

interface State {
  name: string;
  permissions: Permission[];
}

const adminPerms: PermissionType[] = ["canAddPublication", "canDelete", "canPublishTask"];

export const loginStore = reactive<State>({ name: "", permissions: [] });

export const isAuthenticated = computed(() => loginStore.name);

export const hasPermission = (permission: PermissionType) =>
  computed(() => loginStore.permissions.some((p) => p.permission === permission));

export async function login() {
  try {
    const res = await axios.get<any>(`${backendUrl}auth/me`);
    // if (!res.data.permissions.some((p: any) => adminPerms.includes(p.permission))) {
    //   throw new Error("You don't have required permissions");
    // }
    loginStore.name = res.data.fullName || res.data.username || `User ${res.data.id}`;
    loginStore.permissions = res.data.permissions;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status == 401) {
      return;
    }
    throw err;
  }
}

export async function logout() {
  await axios.post(`${backendUrl}auth/logout`);
  loginStore.name = "";
  loginStore.permissions = [];
}

export const initLogin = () =>
  login().catch((err) => {
    console.error(err);
  });
