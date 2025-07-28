import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

const monitoringProductBase = `${backendPublicUrl}monitoring-products`;
describe("GET /api/monitoring-products", () => {
  it("should return 200 with valid list of monitoring products", async () => {
    const res = await axios.get(`${monitoringProductBase}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);

    for (const product of res.data) {
      expect(product).toMatchObject({
        id: expect.stringMatching(/^halo-doppler-lidar_/),
        humanReadableName: expect.any(String),
      });
    }

    const housekeeping = res.data.find((p: any) => p.id === "halo-doppler-lidar_housekeeping");
    expect(housekeeping).toBeDefined();
    expect(housekeeping.humanReadableName).toBe("Housekeeping");
  });
});

describe("GET /api/monitoring-products/variables", () => {
  it("should return 200 with products containing ordered variable metadata", async () => {
    const res = await axios.get(`${monitoringProductBase}/variables`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);

    for (const product of res.data) {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("humanReadableName");
      expect(Array.isArray(product.variables)).toBe(true);

      for (const variable of product.variables) {
        expect(variable).toMatchObject({
          id: expect.any(String),
          humanReadableName: expect.any(String),
          order: expect.any(Number),
        });
      }
    }

    const signalProduct = res.data.find((p: any) => p.id === "halo-doppler-lidar_signal");
    expect(signalProduct).toBeDefined();
    const expectedIds = ["radial-velocity-histogram", "signal_radial-velocity"];
    const actualIds = signalProduct.variables.map((v: any) => v.id);
    expect(actualIds).toEqual(expect.arrayContaining(expectedIds));
  });
});
