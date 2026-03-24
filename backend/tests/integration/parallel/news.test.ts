import "reflect-metadata";
import { backendPublicUrl, genResponse } from "../../lib";
import axios from "axios";
import { describe, expect, it } from "@jest/globals";

// Basic auth credentials for admin user
const auth = {
  username: "admin",
  password: "admin",
};

// News routes return error (singular) instead of errors (plural)
interface NewsError {
  status: number;
  error: string;
}

describe("/api/news", () => {
  describe("GET /api/news/", () => {
    it("should return list of news items ordered by date descending", async () => {
      const res = await axios.get(`${backendPublicUrl}news/`);
      expect(res.status).toBe(200);
      expect(res.data).toBeInstanceOf(Array);
      expect(res.data.length).toBeGreaterThan(0);

      // Check that items are ordered by date descending
      for (let i = 0; i < res.data.length - 1; i++) {
        expect(new Date(res.data[i].date).getTime()).toBeGreaterThanOrEqual(new Date(res.data[i + 1].date).getTime());
      }
    });

    it("should limit the number of news items based on limit parameter", async () => {
      const limit = 3;
      const res = await axios.get(`${backendPublicUrl}news/`, { params: { limit } });
      expect(res.status).toBe(200);
      expect(res.data).toBeInstanceOf(Array);
      expect(res.data.length).toBe(limit);
    });

    it("should default to 10 items if limit is not provided", async () => {
      const res = await axios.get(`${backendPublicUrl}news/`);
      expect(res.status).toBe(200);
      expect(res.data).toBeInstanceOf(Array);
      expect(res.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /api/news/:slug", () => {
    it("should return a specific news item by slug", async () => {
      // First create a news item to get its slug
      const newNewsItem = {
        title: "Test News Item For Get",
        content: "This is a test news item for GET testing.",
        date: "2024-01-01",
      };

      const createRes = await axios.post(`${backendPublicUrl}news/`, newNewsItem, { auth });
      expect(createRes.status).toBe(201);

      // Get the news item by slug
      const slug = "test-news-item-for-get";
      const res = await axios.get(`${backendPublicUrl}news/${slug}`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("title", newNewsItem.title);
      expect(res.data).toHaveProperty("content", newNewsItem.content);
      expect(res.data).toHaveProperty("date");
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
  });

  describe("POST /api/news/", () => {
    it("should create a new news item with valid input including date", async () => {
      const newNewsItem = {
        title: "Test News Item",
        content: "This is a test news item created during testing.",
        date: "2024-01-01",
      };

      const res = await axios.post(`${backendPublicUrl}news/`, newNewsItem, { auth });
      expect(res.status).toBe(201);
    });

    it("should return 400 if date is missing", async () => {
      const invalidNewsItem = {
        title: "Test News Item",
        content: "This is missing a date",
      };

      const expectedBody: NewsError = {
        status: 400,
        error: "title, content, and date are required",
      };

      return expect(axios.post(`${backendPublicUrl}news/`, invalidNewsItem, { auth })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should return 400 if date is not a string", async () => {
      const invalidNewsItem = {
        title: "Test News Item",
        content: "This has an invalid date type",
        date: 123,
      };

      const expectedBody: NewsError = {
        status: 400,
        error: "title, content, and date are required",
      };

      return expect(axios.post(`${backendPublicUrl}news/`, invalidNewsItem, { auth })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should return 400 if title is not a string", async () => {
      const invalidNewsItem = {
        title: 123,
        content: "This has an invalid title type",
        date: "2024-01-01",
      };

      const expectedBody: NewsError = {
        status: 400,
        error: "title, content, and date are required",
      };

      return expect(axios.post(`${backendPublicUrl}news/`, invalidNewsItem, { auth })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should return 400 if content is not a string", async () => {
      const invalidNewsItem = {
        title: "This has invalid content type",
        content: 123,
        date: "2024-01-01",
      };

      const expectedBody: NewsError = {
        status: 400,
        error: "title, content, and date are required",
      };

      return expect(axios.post(`${backendPublicUrl}news/`, invalidNewsItem, { auth })).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });
  });
});
