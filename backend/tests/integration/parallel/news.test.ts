import "reflect-metadata";
import { backendPublicUrl, backendPrivateUrl, genResponse } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

const auth = {
  username: "admin",
  password: "admin",
};

interface NewsError {
  status: number;
  error: string;
}

describe("/api/news", () => {
  describe("GET /api/news/", () => {
    it("should return list of news items ordered by date descending", async () => {
      const res = await axios.get(`${backendPublicUrl}news/`);
      expect(res.status).toBe(200);
      expect(res.data.results).toBeInstanceOf(Array);
      expect(res.data.results.length).toBe(4);
      expect(res.data.pagination.totalItems).toBe(4);

      for (let i = 0; i < res.data.results.length - 1; i++) {
        expect(new Date(res.data.results[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(res.data.results[i + 1].date).getTime(),
        );
      }
    });

    it("should limit the number of news items based on pageSize parameter", async () => {
      const pageSize = 3;
      const res = await axios.get(`${backendPublicUrl}news/`, { params: { pageSize } });
      expect(res.status).toBe(200);
      expect(res.data.results).toBeInstanceOf(Array);
      expect(res.data.results.length).toBe(pageSize);
    });

    it("should default to 10 items if pageSize is not provided", async () => {
      const res = await axios.get(`${backendPublicUrl}news/`);
      expect(res.status).toBe(200);
      expect(res.data.results).toBeInstanceOf(Array);
      expect(res.data.results.length).toBeLessThanOrEqual(10);
      expect(res.data.pagination.pageSize).toBe(10);
    });

    it("should show draft news items to authenticated users with permission", async () => {
      const res = await axios.get(`${backendPublicUrl}news/`, { auth });
      expect(res.status).toBe(200);
      expect(res.data.results.length).toBe(5);
      const draftInList = res.data.results.some(
        (item: any) => item.title === "Cloudnet team discovers new cloud type" && item.draft,
      );
      expect(draftInList).toBe(true);
    });

    it("should support pagination with page parameter", async () => {
      const pageSize = 2;
      const res = await axios.get(`${backendPublicUrl}news/`, { params: { page: 1, pageSize } });
      expect(res.status).toBe(200);
      expect(res.data.results.length).toBe(pageSize);
      expect(res.data.pagination.currentPage).toBe(1);
      expect(res.data.pagination.pageSize).toBe(pageSize);
    });

    it("should return 400 for invalid page parameter", async () => {
      const expectedBody: NewsError = {
        status: 400,
        error: "Invalid page parameter",
      };
      return expect(axios.get(`${backendPublicUrl}news/`, { params: { page: -1 } })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should return 400 for invalid pageSize parameter", async () => {
      const expectedBody: NewsError = {
        status: 400,
        error: "Invalid pageSize parameter",
      };
      return expect(axios.get(`${backendPublicUrl}news/`, { params: { pageSize: 0 } })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });
  });

  describe("GET /api/news/:slug", () => {
    it("should return a specific news item by slug", async () => {
      const res = await axios.get(`${backendPublicUrl}news/record-breaking-data-upload`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("title", "Record-breaking data upload");
    });

    it("should return 404 if news item is not found", async () => {
      const nonExistentSlug = "non-existent-slug";
      const expectedBody: NewsError = {
        status: 404,
        error: "News item not found",
      };
      return expect(axios.get(`${backendPublicUrl}news/${nonExistentSlug}`)).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should not show draft news items to unauthenticated users by slug", async () => {
      const slug = "cloudnet-team-discovers-new-cloud-type";
      const expectedBody: NewsError = {
        status: 404,
        error: "News item not found",
      };
      return expect(axios.get(`${backendPublicUrl}news/${slug}`)).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should show draft news items to authenticated users by slug", async () => {
      const slug = "cloudnet-team-discovers-new-cloud-type";
      const res = await axios.get(`${backendPublicUrl}news/${slug}`, { auth });
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("title", "Cloudnet team discovers new cloud type");
      expect(res.data).toHaveProperty("draft", true);
    });
  });

  describe("GET /news.atom", () => {
    it("should return valid Atom feed", async () => {
      const res = await axios.get(`${backendPrivateUrl}news.atom`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/atom+xml");
      expect(res.data.match(/<entry>/g).length).toBe(4);
      expect(res.data).toContain("<title>Cloudnet data portal wins prestigious award</title>");
      expect(res.data).toContain("<title>New feature: cloud pattern recognition</title>");
      expect(res.data).toContain("<title>Data portal survives solar eclipse</title>");
      expect(res.data).toContain("<title>Record-breaking data upload</title>");
      expect(res.data).not.toContain("<title>Cloudnet team discovers new cloud type</title>");
      expect(res.data).toMatchSnapshot();
    });
  });
});
