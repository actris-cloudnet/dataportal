import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

describe("/api/upload-amount", () => {
  const url = `${backendPublicUrl}upload-amount`;
  const instrumentPid = "https://hdl.handle.net/123/bucharest-chm15k";
  const expected = [{ date: "2020-08-12", fileCount: 2, totalSize: 34424509440 }];

  it("returns upload amounts for instrument", async () => {
    const res = await axios.get(url, { params: { instrumentPid } });
    expect(res.data).toEqual(expected);
  });

  it("filters by site", async () => {
    const res = await axios.get(url, { params: { instrumentPid, site: "bucharest" } });
    expect(res.data).toEqual(expected);
  });

  it("returns nothing for other site", async () => {
    const res = await axios.get(url, { params: { instrumentPid, site: "warsaw" } });
    expect(res.data).toEqual([]);
  });
});
