import axios from "axios";
import { computed, reactive } from "vue";
import { backendUrl } from ".";
import type { Permission, PermissionType } from "@shared/entity/Permission";
import type { UserAccount } from "@shared/entity/UserAccount";

interface State {
  isAuthenticated: boolean;
  name: string;
  permissions: Permission[];
}

export const loginStore = reactive<State>({ isAuthenticated: false, name: "", permissions: [] });

export const hasPermission = (permission: PermissionType) =>
  computed(() => loginStore.permissions.some((p) => p.permission === permission));

export async function login(username: string, password: string) {
  const res = await axios.post<UserAccount>(`${backendUrl}auth/login`, { username, password });
  setUserState(res.data);
}

export async function checkLogin() {
  try {
    const res = await axios.get<UserAccount>(`${backendUrl}auth/me`);
    setUserState(res.data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status == 401) {
      return;
    }
    throw err;
  }
}

export async function logout() {
  await axios.post(`${backendUrl}auth/logout`);
  loginStore.isAuthenticated = false;
  loginStore.name = "";
  loginStore.permissions = [];
}

function setUserState(user: UserAccount) {
  loginStore.isAuthenticated = true;
  loginStore.name = user.fullName || user.username || `User ${user.id}`;
  loginStore.permissions = user.permissions;
}

export const initLogin = () =>
  checkLogin().catch((err) => {
    console.error(err);
  });
