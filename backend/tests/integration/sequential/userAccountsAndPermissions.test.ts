import axios from "axios";
import { readFileSync } from "node:fs";
import { backendPrivateUrl } from "../../lib";
import { DataSource } from "typeorm/";
import { AppDataSource } from "../../../src/data-source";
import { UserAccount } from "../../../src/entity/UserAccount";
import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";

const USER_ACCOUNTS_URL = backendPrivateUrl.concat("user-accounts");

let dataSource: DataSource;
let userAccountRepository: any;

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  userAccountRepository = dataSource.getRepository(UserAccount);
  await userAccountRepository.createQueryBuilder().delete().execute();
});

afterAll(async () => {
  await userAccountRepository.createQueryBuilder().delete().execute();
  await dataSource.destroy();
});

describe("test user accounts and permissions", () => {
  let userData: any[];

  beforeAll(async () => {
    await userAccountRepository.createQueryBuilder().delete().execute();
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

  it("changes alice's username to alice ie does nothing", async () => {
    const alice = await handlePerson("alice");
    await expect(axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), { username: "alice" })).resolves.toMatchObject({
      status: 200,
      data: { id: alice.id, username: "alice" },
    });
  });

  it("changes alice's username and then resets it back", async () => {
    const alice = await handlePerson("alice");
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

  it("changes alice's password", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        password: "alices_new_password",
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: { id: alice.id },
    });
    const respGetWithNewPassword = await axios.get(USER_ACCOUNTS_URL.concat("/", alice.id));
    const aliceFromDb = await userAccountRepository.findOneBy({ id: alice.id });
    expect(aliceFromDb.passwordHash).toMatch("$apr1$");
    expect(aliceFromDb.passwordHash).not.toEqual(alice.passwordHash);
    expect(respGetWithNewPassword.data.permissions).toEqual(alice.permissions);
  });

  it("fails to change alice's username to already existing one", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const alice = getRespAllUsers.data.find((u: any) => u.username === "alice");
    for (const user of getRespAllUsers.data) {
      if (user.username === alice.username) continue;
      await expect(
        axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), { username: user.username }),
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    }
  });

  it("removes alice's permissions and then adds some", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [],
      }),
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
          { siteId: "granada", modelId: null, permission: "canUpload" },
          { siteId: null, modelId: null, permission: "canUploadModel" },
        ],
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "alice",
        permissions: [
          { siteId: "granada", modelId: null, permission: "canUpload" },
          { siteId: null, modelId: null, permission: "canUploadModel" },
        ],
      },
    });
  });

  it("changes bobs permissions", async () => {
    const bob = await handlePerson("bob");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", bob.id), {
        permissions: [
          { siteId: "granada", modelId: null, permission: "canUpload" },
          { siteId: "mace-head", modelId: null, permission: "canUpload" },
        ],
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "bob",
        permissions: [
          { siteId: "granada", modelId: null, permission: "canUpload" },
          { siteId: "mace-head", modelId: null, permission: "canUpload" },
        ],
      },
    });
  });

  it("tries to add permission for alice for a nonexistence site", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [
          { siteId: "granadaTypo", modelId: null, permission: "canUpload" },
          { siteId: null, modelId: null, permission: "canUploadModel" },
        ],
      }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("tries to add nonexistence permission", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [
          { siteId: "granada", modelId: null, permission: "canUpload" },
          { siteId: null, modelId: null, permission: "canUploadModelTYPO" },
        ],
      }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });

  it("tries to change empty password", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        password: "",
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("tries to change empty username", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        username: "",
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("add model permissions", async () => {
    const alice = await handlePerson("alice");
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [],
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "alice",
        permissions: [],
      },
    });
    await expect(
      axios.put(USER_ACCOUNTS_URL.concat("/", alice.id), {
        permissions: [{ siteId: "granada", modelId: "ecmwf", permission: "canUploadModel" }],
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: {
        username: "alice",
        permissions: [{ siteId: "granada", modelId: "ecmwf", permission: "canUploadModel" }],
      },
    });
  });

  it("deletes alices account", async () => {
    const alice = await handlePerson("alice");
    await expect(axios.delete(USER_ACCOUNTS_URL.concat("/", alice.id))).resolves.toMatchObject({ status: 200 });
    await expect(axios.get(USER_ACCOUNTS_URL.concat("/", alice.id))).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("gets all accounts", async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const users = getRespAllUsers.data.map((u: any) => u.username);
    const expectedUsers = new Set(["bob", "carol", "david", "eve", "bucharest", "granada", "mace-head"]);
    const intersection = users.filter((u: string) => expectedUsers.has(u));
    expect(intersection).toHaveLength(7);
  });

  async function handlePerson(userName: string) {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL);
    const user = getRespAllUsers.data.find((u: any) => u.username === userName);
    expect(userName).not.toBeUndefined();
    expect(user.username).toBe(userName);
    return user;
  }
});
