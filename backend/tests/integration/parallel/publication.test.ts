import "reflect-metadata";
import { backendPublicUrl, genResponse } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

describe("/api/publications", () => {
  describe("GET /api/publications/", () => {
    it("should return list of publications", async () => {
      const res = await axios.get(`${backendPublicUrl}publications/`);
      expect(res.status).toBe(200);
      expect(res.data).toMatchSnapshot();
    });

    it("should limit the number of publications based on valid limit parameter", async () => {
      const limit = 1;
      const res = await axios.get(`${backendPublicUrl}publications/`, { params: { limit } });
      expect(res.status).toBe(200);
      expect(res.data).toBeInstanceOf(Array);
      expect(res.data.length).toBe(limit);
    });

    it("should return 400 when limit parameter is invalid string", async () => {
      const expectedBody = {
        status: 400,
        error: "limit is invalid",
      };
      await expect(
        axios.get(`${backendPublicUrl}publications/`, { params: { limit: "invalid" } }),
      ).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody));
    });

    it("should return 400 when limit parameter is negative", async () => {
      const expectedBody = {
        status: 400,
        error: "limit is invalid",
      };
      await expect(axios.get(`${backendPublicUrl}publications/`, { params: { limit: -1 } })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });
  });
});
