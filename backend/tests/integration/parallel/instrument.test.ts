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

  it("returns no instrument with product", async () => {
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

  it("returns first instrument with product", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", product: "lidar", date: "2024-03-01" } });
    expect(res.data).toMatchObject({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-01-01",
      nominalInstrument: { uuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0" },
    });
  });

  it("returns second instrument with product", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", product: "lidar", date: "2024-09-01" } });
    expect(res.data).toMatchObject({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-06-01",
      nominalInstrument: { uuid: "eb4b39e5-6bc8-40f0-92d2-43d31f224de6" },
    });
  });

  it("returns no instruments without product", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", date: "2023-01-01" } });
    expect(res.data).toHaveLength(0);
  });

  it("returns first instrument without product", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", date: "2024-03-01" } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-01-01",
      nominalInstrument: { uuid: "c43e9f54-c94d-45f7-8596-223b1c2b14c0" },
    });
  });

  it("returns second instrument without product", async () => {
    const res = await axios.get(url, { params: { site: "bucharest", date: "2024-09-01" } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({
      siteId: "bucharest",
      productId: "lidar",
      measurementDate: "2024-06-01",
      nominalInstrument: { uuid: "eb4b39e5-6bc8-40f0-92d2-43d31f224de6" },
    });
  });
});
