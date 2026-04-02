import "reflect-metadata";
import { backendPublicUrl, genResponse } from "../../lib";
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
      expect(res.data).toBeInstanceOf(Array);
      expect(res.data.length).toBeGreaterThan(0);

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

    it("should not show draft news items to unauthenticated users in list", async () => {
      const draftNewsItem = {
        title: "Draft News Item",
        content: "This is a draft news item that should not be visible.",
        date: "2024-01-01",
        draft: true,
      };

      await axios.post(`${backendPublicUrl}news/`, draftNewsItem, { auth });

      const res = await axios.get(`${backendPublicUrl}news/`);
      expect(res.status).toBe(200);

      const draftInList = res.data.some((item: any) => item.title === draftNewsItem.title);
      expect(draftInList).toBe(false);
    });

    it("should show draft news items to authenticated users with permission", async () => {
      const draftNewsItem = {
        title: "Draft News Item For Auth Test",
        content: "This is a draft news item that should be visible to admins.",
        date: "2024-01-01",
        draft: true,
      };

      await axios.post(`${backendPublicUrl}news/`, draftNewsItem, { auth });

      const res = await axios.get(`${backendPublicUrl}news/`, { auth });
      expect(res.status).toBe(200);

      const draftInList = res.data.some((item: any) => item.title === draftNewsItem.title);
      expect(draftInList).toBe(true);
    });
  });

  describe("GET /api/news/:slug", () => {
    it("should return a specific news item by slug", async () => {
      const newNewsItem = {
        title: "Test News Item For Get",
        content: "This is a test news item for GET testing.",
        date: "2024-01-01",
        draft: false,
      };

      const createRes = await axios.post(`${backendPublicUrl}news/`, newNewsItem, { auth });
      expect(createRes.status).toBe(201);

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

    it("should not show draft news items to unauthenticated users by slug", async () => {
      const draftNewsItem = {
        title: "Draft News Item For Slug Test",
        content: "This is a draft news item that should not be accessible.",
        date: "2024-01-01",
        draft: true,
      };

      await axios.post(`${backendPublicUrl}news/`, draftNewsItem, { auth });

      const slug = "draft-news-item-for-slug-test";
      const expectedBody: NewsError = {
        status: 404,
        error: "News item not found",
      };

      return expect(axios.get(`${backendPublicUrl}news/${slug}`)).rejects.toMatchObject(
        genResponse(expectedBody.status, expectedBody),
      );
    });

    it("should show draft news items to authenticated users by slug", async () => {
      const draftNewsItem = {
        title: "Draft News Item For Auth Slug Test",
        content: "This is a draft news item that should be accessible to admins.",
        date: "2024-01-01",
        draft: true,
      };

      await axios.post(`${backendPublicUrl}news/`, draftNewsItem, { auth });

      const slug = "draft-news-item-for-auth-slug-test";
      const res = await axios.get(`${backendPublicUrl}news/${slug}`, { auth });
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("title", draftNewsItem.title);
      expect(res.data).toHaveProperty("content", draftNewsItem.content);
      expect(res.data).toHaveProperty("draft", true);
    });
  });

  describe("POST /api/news/", () => {
    it("should create a new news item with valid input including date", async () => {
      const newNewsItem = {
        title: "Test News Item",
        content: "This is a test news item created during testing.",
        date: "2024-01-01",
        draft: false,
      };

      const res = await axios.post(`${backendPublicUrl}news/`, newNewsItem, { auth });
      expect(res.status).toBe(201);
    });

    it("should return 400 if date is missing", async () => {
      const invalidNewsItem = {
        title: "Test News Item",
        content: "This is missing a date",
        draft: false,
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
        draft: false,
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
        draft: false,
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
        draft: false,
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
