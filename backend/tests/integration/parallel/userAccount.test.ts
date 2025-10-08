import axios from "axios";
import { backendPublicUrl } from "../../lib";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}auth/login`;
const headers = { "content-type": "application/json" };

describe("GET /auth/login", () => {
  it("returns unauthorized error", async () => {
    await expect(axios.post(url, { username: "hax0r", password: "hax0r" }, { headers })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("return submitter permissions", async () => {
    const res = await axios.post(url, { username: "submitter", password: "submitter" }, { headers });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchSnapshot();
    expect(res.headers).toHaveProperty("set-cookie");
  });

  it("returns admin permissions", async () => {
    const res = await axios.post(url, { username: "admin", password: "admin" }, { headers });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchSnapshot();
    expect(res.headers).toHaveProperty("set-cookie");
  });

  // TODO: more tests
});
