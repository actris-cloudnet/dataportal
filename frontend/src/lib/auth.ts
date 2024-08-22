import axios from "axios";
import { computed, reactive } from "vue";
import { backendUrl } from ".";
import type { Permission, PermissionType } from "@shared/entity/Permission";

interface State {
  username: string;
  password: string;
  permissions: Permission[];
}

const adminPerms: PermissionType[] = ["canAddPublication", "canDelete", "canPublishTask"];

export const loginStore = reactive<State>({ username: "", password: "", permissions: [] });

export const isAuthenticated = computed(() => loginStore.permissions.length > 0);

export async function hasPermission(permission: PermissionType) {
  await restoreLogin;
  return loginStore.permissions.some((p) => p.permission === permission);
}

export async function login(username: string, password: string) {
  try {
    const res = await axios.get<Permission[]>(`${backendUrl}users/me`, { auth: { username, password } });
    if (!res.data.some((p) => adminPerms.includes(p.permission))) {
      throw new Error("You don't have required permissions");
    }
    loginStore.username = localStorage.username = username;
    loginStore.password = localStorage.password = password;
    loginStore.permissions = res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status == 401) {
      throw new Error("Incorrect username or password");
    }
    throw err;
  }
}

export function logout() {
  loginStore.username = localStorage.username = "";
  loginStore.password = localStorage.password = "";
  loginStore.permissions = [];
}

const restoreLogin =
  localStorage.username && localStorage.password
    ? login(localStorage.username, localStorage.password).catch((err) => {
        console.error(err);
      })
    : Promise.resolve();
