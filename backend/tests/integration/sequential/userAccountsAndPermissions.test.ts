import axios from "axios";
import { readFileSync } from "fs";
import { backendPrivateUrl } from "../../lib";
import { Connection, createConnection } from "typeorm/";

const USER_ACCOUNTS_URL = backendPrivateUrl.concat("user-accounts");

let conn: Connection;
let userAccountRepository: any;

beforeAll(async () => {
  conn = await createConnection();
  userAccountRepository = conn.getRepository("user_account");
});

afterAll(async () => {
  await conn.close();
});

describe("test user accounts and permissions", () => {
  let userData: any[];
  beforeAll(async () => {
    await userAccountRepository.delete({});
    userData = JSON.parse(readFileSync("tests/data/userAccountsAndPermissions.json", "utf8"));
    expect(userData).toHaveLength(8);
  });
  it("posts user accounts and permissions", async () => {
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
  });

  it("changes alices username and then resets it back", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), { username: "Ecila" })).resolves.toMatchObject({
      status: 200,
      data: { id: alice.id },
    });
    await expect(axios.get(USER_ACCOUNTS_URL.concat("/", alice.id))).resolves.toMatchObject({
      data: { username: "Ecila" },
    });
    await expect(axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), { username: "alice" })).resolves.toMatchObject({
      status: 200,
      data: { username: "alice" },
    });
  });
  it("changes alices password", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        password: "alices_new_password",
      })
    ).resolves.toMatchObject({
      status: 200,
      data: { id: alice.id },
    });
    const respGetWithNewPassword = await axios.get(USER_ACCOUNTS_URL.concat("/", alice.id));
    const aliceFromDb = await userAccountRepository.findOne({ id: alice.id });
    expect(aliceFromDb.passwordHash).toMatch("$apr1$");
    expect(aliceFromDb.passwordHash).not.toEqual(alice.passwordHash);
    expect(respGetWithNewPassword.data.permissions).toEqual(alice.permissions);
  });

  it("removes alices permissions and then adds some", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [],
      })
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "alice",
        permissions: [],
      },
    });
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [
          { siteId: "granada", permission: "canUpload" },
          { siteId: null, permission: "canUploadModel" },
        ],
      })
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "alice",
        permissions: [
          { siteId: "granada", permission: "canUpload" },
          { siteId: null, permission: "canUploadModel" },
        ],
      },
    });
  });
  it("changes bobs permissions", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const bob = getRespAllUsers.data.find((u: any) => u.username === "bob");
    expect(bob).not.toBeUndefined();
    expect(bob.username).toBe("bob");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", bob.id), {
        permissions: [
          { siteId: "granada", permission: "canUpload" },
          { siteId: "mace-head", permission: "canUpload" },
        ],
      })
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "bob",
        permissions: [
          { siteId: "granada", permission: "canUpload" },
          { siteId: "mace-head", permission: "canUpload" },
        ],
      },
    });
  });
  it("tries to add permission for alice for a nonexistence site", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [
          { siteId: "granadaTypo", permission: "canUpload" },
          { siteId: null, permission: "canUploadModel" },
        ],
      })
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
  it("tries to add nonexistence permission", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [
          { siteId: "granada", permission: "canUpload" },
          { siteId: null, permission: "canUploadModelTYPO" },
        ],
      })
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
  it("tries to change empty password", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        password: "",
      })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });
  it("tries to change empty username", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        username: "",
      })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });
  it("deletes alices account", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    expect(alice).not.toBeUndefined();
    expect(alice.username).toBe("alice");
    await expect(axios.delete(USER_ACCOUNTS_URL.concat("/", alice.id))).resolves.toMatchObject({ status: 200 });
    await expect(axios.get(USER_ACCOUNTS_URL.concat("/", alice.id))).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
  it("gets all accounts", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const users = getRespAllUsers.data.map((u: any) => u.username);
    const expectedUsers = new Set(["bob", "carol", "david", "eve", "bucharest", "granada", "mace-head"]);
    const intersec = users.filter((u: string) => expectedUsers.has(u));
    expect(intersec).toHaveLength(7);
  });
  it("migrates legacy user accounts", async () => {
    // Delete existing legacy users from the database
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    for (const legacyUserStr of ["bucharest", "granada", "mace-head"]) {
      const user = getRespAllUsers.data.find((u: any) => u.username === legacyUserStr);
      await axios.delete(USER_ACCOUNTS_URL.concat("/", user.id));
    }
    const legacyUsers = JSON.parse(readFileSync("tests/data/legacyUserAccountCredentials.json", "utf8"));
    for (const legacyLine of legacyUsers) {
      const [username, passwordHash] = legacyLine.split(":", 2);
      expect([username, passwordHash].join(":")).toEqual(legacyLine);
      const resp = await axios.post(USER_ACCOUNTS_URL.concat("/migrate-legacy"), {
        username: username,
        passwordHash: passwordHash,
      });
      expect(resp).toMatchObject({ status: 201 });
      await expect(axios.get(USER_ACCOUNTS_URL.concat("/", resp.data.id))).resolves.toMatchObject({
        status: 200,
        data: { username: username },
      });
      const userFromDb = await userAccountRepository.findOne({ id: resp.data.id });
      expect(userFromDb.passwordHash).toEqual(passwordHash);
    }
  });
});
