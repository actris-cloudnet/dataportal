import axios from "axios";
import { backendPrivateUrl } from "../../lib";
import { Connection, createConnection } from "typeorm/";

let conn: Connection;
let userAccountRepository: any;

beforeAll(async () => {
  conn = await createConnection();
  userAccountRepository = conn.getRepository("user_account");
  await userAccountRepository.delete({});
});

afterAll(async () => {
  await userAccountRepository.delete({});
  await conn.close();
});

describe("test user account activation", () => {
  let activationToken: string;

  it("creates user with activation token", async () => {
    const res = await axios.post(`${backendPrivateUrl}user-accounts`, {
      username: "liisa",
      permissions: [
        {
          siteId: "hyytiala",
          permission: "canUpload",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("activationToken");
    activationToken = res.data.activationToken;
  });

  it("fails with invalid token", async () => {
    await expect(axios.get(`${backendPrivateUrl}credentials/invalid`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("succeeds with valid token", async () => {
    const res = await axios.get(`${backendPrivateUrl}credentials/${activationToken}`);
    expect(res.status).toBe(200);
  });

  it("activates user account", async () => {
    const res = await axios.post(`${backendPrivateUrl}credentials/${activationToken}`);
    expect(res.status).toBe(201);
    expect(res.data).toContain("<strong>Username:</strong> liisa");
    const match = res.data.match(/<strong>Password:<\/strong> (\w+)/);
    expect(match).not.toBeNull();
    const password = match![1];
    const user = await userAccountRepository.findOneOrFail({ username: "liisa" });
    expect(user.activationToken).toBeNull();
    expect(user.passwordHash).not.toBeNull();
    expect(user.comparePassword(password)).toBeTruthy();
  });

  it("can activate user account only once", async () => {
    await expect(axios.post(`${backendPrivateUrl}credentials/${activationToken}`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
