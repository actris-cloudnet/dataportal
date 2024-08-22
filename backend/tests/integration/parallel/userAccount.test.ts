import axios from "axios";
import { backendPublicUrl } from "../../lib";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}users/me/`;
const headers = { "content-type": "application/json" };

describe("GET /users/me", () => {
  it("returns unauthorized error", async () => {
    await expect(axios.get(url, { headers, auth: { username: "hax0r", password: "hax0r" } })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("return submitter permissions", async () => {
    const res = await axios.get(url, { headers, auth: { username: "submitter", password: "submitter" } });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchSnapshot();
  });

  it("returns admin permissions", async () => {
    const res = await axios.get(url, { headers, auth: { username: "admin", password: "admin" } });
    expect(res.status).toEqual(200);
    expect(res.data).toMatchSnapshot();
  });
});
