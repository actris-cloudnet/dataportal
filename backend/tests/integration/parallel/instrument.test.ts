import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { readResources } from "../../../../shared/lib";
import { describe, expect, it, beforeAll } from "@jest/globals";

describe("/api/instruments", () => {
  const url = `${backendPublicUrl}instruments`;
  let responses: any;

  beforeAll(async () => (responses = await readResources()));

  it("responds with a json including products", async () => {
    const res = await axios.get(url);
    return expect(res.data).toMatchObject(responses["instruments"]);
  });
});

describe("/api/nominal-instrument", () => {
  const url = `${backendPublicUrl}nominal-instrument`;

  it("returns no instrument", async () => {
    const res = axios.get(url, { params: { site: "bucharest", product: "lidar", date: "2023-01-01" } });
    await expect(res).rejects.toMatchObject({
      response: {
        data: {
          status: 404,
          errors: "Nominal instrument not specified",
        },
      },
    });
  });

  it("returns first instrument", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", product: "lidar", date: "2024-03-01" } });
    expect(res.data.nominalInstrument.uuid).toBe("c43e9f54-c94d-45f7-8596-223b1c2b14c0");
  });

  it("returns second instrument", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", product: "lidar", date: "2024-09-01" } });
    expect(res.data.nominalInstrument.uuid).toBe("eb4b39e5-6bc8-40f0-92d2-43d31f224de6");
  });
});
