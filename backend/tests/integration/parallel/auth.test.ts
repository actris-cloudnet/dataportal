import axios from "axios";
import { backendPublicUrl } from "../../lib";
import { hashVerifier, Token } from "../../../src/entity/Token";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { randomBytes } from "node:crypto";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../../src/data-source";

const loginUrl = `${backendPublicUrl}auth/login`;
const logoutUrl = `${backendPublicUrl}auth/logout`;
const meUrl = `${backendPublicUrl}auth/me`;
const headers = { "content-type": "application/json" };

let dataSource: DataSource;
let tokenRepo: Repository<Token>;

beforeAll(async () => {
  dataSource = await AppDataSource.initialize();
  tokenRepo = dataSource.getRepository(Token);
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("GET /auth/login", () => {
  it("returns unauthorized error", async () => {
    await expect(axios.post(loginUrl, { username: "hax0r", password: "hax0r" }, { headers })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("rejects login by submitter", async () => {
    await expect(
      axios.post(loginUrl, { username: "submitter", password: "submitter" }, { headers }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("returns admin permissions", async () => {
    const res = await axios.post(loginUrl, { username: "admin", password: "admin" }, { headers });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchSnapshot();
    expect(res.headers).toHaveProperty("set-cookie");
  });
});

describe("GET /auth/me", () => {
  it("returns unauthorized error without cookie", async () => {
    await expect(axios.get(meUrl)).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("returns unauthorized error with invalid cookie", async () => {
    await expect(axios.get(meUrl, { headers: { cookie: "token=abc123" } })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("returns current user with cookie from login", async () => {
    const resLogin = await axios.post(loginUrl, { username: "admin", password: "admin" }, { headers });
    expect(resLogin.status).toEqual(200);
    expect(resLogin.headers).toHaveProperty("set-cookie");
    const cookie = resLogin.headers["set-cookie"]!.map((c) => c.split(";")[0]);
    const resMe = await axios.get(meUrl, { headers: { cookie } });
    expect(resMe.status).toEqual(200);
    expect(resMe.data).toMatchSnapshot();
  });

  it("returns current user with new cookie", async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = await createToken(expiresAt);
    const resMe = await axios.get(meUrl, { headers: { cookie: `token=${token}` } });
    expect(resMe.status).toEqual(200);
    expect(resMe.data).toMatchSnapshot();
  });

  it("returns unauthorized error with expired cookie", async () => {
    const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const token = await createToken(expiresAt);
    await expect(axios.get(meUrl, { headers: { cookie: `token=${token}` } })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

describe("GET /auth/logout", () => {
  it("logs out current user", async () => {
    const resLogin = await axios.post(loginUrl, { username: "admin", password: "admin" }, { headers });
    expect(resLogin.status).toEqual(200);
    const cookie = resLogin.headers["set-cookie"]!.map((c) => c.split(";")[0]);
    const resMe = await axios.get(meUrl, { headers: { cookie } });
    expect(resMe.status).toEqual(200);
    await axios.post(logoutUrl, undefined, { headers: { cookie } });
    expect(resMe.status).toEqual(200);
    await expect(axios.get(meUrl, { headers: { cookie } })).rejects.toMatchObject({ response: { status: 401 } });
  });
});

async function createToken(expiresAt: Date) {
  const selector = randomBytes(16);
  const verifier = randomBytes(16);
  await tokenRepo.insert({
    selector,
    verifierHash: hashVerifier(verifier),
    userAccount: { id: 1 },
    expiresAt,
  });
  return selector.toString("hex") + verifier.toString("hex");
}
