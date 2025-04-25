import axios from "axios";
import { backendPublicUrl } from "../../lib";
import { describe, expect, it } from "@jest/globals";

const url = `${backendPublicUrl}calibration/`;

describe("GET /api/calibration", () => {
  it("responds with the correct calibration for correct date", async () => {
    const res = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-01" },
    });
    expect(res.data.data).toEqual({ time_offset: 120, calibration_factor: 0.5 });
  });

  it("responds with the latest calibration", async () => {
    const res = await axios.get(url, {
      params: { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2021-01-05" },
    });
    expect(res.data.data).toEqual({ time_offset: 120, calibration_factor: 0.9 });
  });

  it("responds with 404 if instrument has no calibration set", async () => {
    const params = { instrumentPid: "https://hdl.handle.net/123/hyytiala-chm15k", date: "2021-01-01" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("responds with 404 if calibration is set only for a later date", async () => {
    const params = { instrumentPid: "https://hdl.handle.net/123/bucharest-chm15k", date: "2020-12-31" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("responds with 400 if one of the mandatory arguments is not set", async () => {
    const params = { instrument: "https://hdl.handle.net/123/bucharest-chm15k" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 400 } });
  });
});
