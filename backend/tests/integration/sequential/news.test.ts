import "reflect-metadata";
import { backendPublicUrl, genResponse, cleanRepos, loadFixture } from "../../lib";
import axios from "axios";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { AppDataSource } from "../../../src/data-source";
import { DataSource } from "typeorm";

const auth = {
  username: "admin",
  password: "admin",
};

interface NewsError {
  status: number;
  error: string;
}

describe("/api/news", () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
    await cleanRepos(dataSource);
    await loadFixture(dataSource, "0-model_citation");
    await loadFixture(dataSource, "0-regular_citation");
    await loadFixture(dataSource, "0-software");
    await loadFixture(dataSource, "1-site");
    await loadFixture(dataSource, "1-product");
    await loadFixture(dataSource, "1-model");
    await loadFixture(dataSource, "2-instrument");
    await loadFixture(dataSource, "2-permission");
    await loadFixture(dataSource, "5-instrument_log_permission");
    await loadFixture(dataSource, "5-user_account");
  });

  afterAll(async () => await dataSource.destroy());

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
