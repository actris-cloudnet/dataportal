import axios from "axios";
import { readFileSync } from "node:fs";
import { backendPrivateUrl } from "../lib";
import { expect } from "@jest/globals";

export async function initUsersAndPermissions() {
  const USER_ACCOUNTS_URL = `${backendPrivateUrl}user-accounts`;
  // Remove users
  const existingUsers = (await axios.get(USER_ACCOUNTS_URL)).data;
  for (const user of existingUsers) {
    await expect(axios.delete(USER_ACCOUNTS_URL.concat("/", user.id))).resolves.toMatchObject({ status: 200 });
  }
  // add users
  const userData = JSON.parse(readFileSync("tests/data/userAccountsAndPermissions.json", "utf8"));
  expect(userData).toHaveLength(8);
  for (const user of userData) {
    const postResp = await axios.post(USER_ACCOUNTS_URL, user);
    expect(postResp).toMatchObject({
      status: 201,
      data: { username: user.username },
    });
    await expect(axios.get(USER_ACCOUNTS_URL.concat("/", postResp.data.id))).resolves.toMatchObject({
      status: 200,
      data: { username: user.username },
    });
  }
}
