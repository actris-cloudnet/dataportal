import axios from "axios";
import { backendPublicUrl } from "../../lib";

const url = `${backendPublicUrl}calibration/`;

describe("GET /api/calibration", () => {
  it("responds with the correct calibration for correct date", async () => {
    const res = await axios.get(url, { params: { instrumentPid: "hyytiala-mira", date: "2021-01-01" } });
    expect(res.data.data).toEqual({ calibrationFactor: 0.5 });
    expect(res.data).toHaveProperty("createdAt");
    expect(res.data).toHaveProperty("updatedAt");
  });

  it("responds with the latest calibration", async () => {
    const res = await axios.get(url, { params: { instrumentPid: "hyytiala-mira", date: "2021-01-05" } });
    expect(res.data.data).toEqual({ calibrationFactor: 0.9 });
    expect(res.data).toHaveProperty("createdAt");
    expect(res.data).toHaveProperty("updatedAt");
  });

  it("responds with 404 if instrument has no calibration set", async () => {
    const params = { instrumentPid: "hyytiala-chm15k", date: "2021-01-01" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("responds with 404 if calibration is set only for a later date", async () => {
    const params = { instrumentPid: "hyytiala-mira", date: "2020-12-31" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("responds with 400 if one of the mandatory arguments is not set", async () => {
    const params = { instrument: "hyytiala-chm15k" };
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 400 } });
  });
});
