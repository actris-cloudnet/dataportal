import { backendPublicUrl } from "../../lib";
import axios from "axios";
import { RequestError } from "../../../src/entity/RequestError";
import { describe, expect, it } from "@jest/globals";

const testUuid = "9e04d8ef-0f2b-4823-835d-33e458403c67";

describe("/api/files/:uuid", () => {
  const url = `${backendPublicUrl}files/`;
  const expectedBody404: RequestError = {
    status: 404,
    errors: ["No files match this UUID"],
  };

  it("request succeeds on instrument file", async () => {
    const res = await axios.get(`${url}38092c00-161d-4ca2-a29d-628cf8e960f6`);
    expect(res.data).toMatchSnapshot();
  });

  it("request succeeds on model file", async () => {
    const res = await axios.get(`${url}b5d1d5af-3667-41bc-b952-e684f627d91c`);
    expect(res.data).toMatchSnapshot();
  });

  it("responds with a 404 on test file if in normal mode", async () => {
    return expect(axios.get(url + testUuid)).rejects.toMatchObject({ response: { data: expectedBody404 } });
  });

  it("responds with a 400 if invalid uuid", async () => {
    const expectedBody = { ...expectedBody404, ...{ errors: ["Not found: invalid UUID"] } };
    return expect(axios.get(`${url}kisuli`)).rejects.toMatchObject({ response: { data: expectedBody } });
  });

  it("request succeeds on a test file in developer mode", async () => {
    return expect(axios.get(url + testUuid, { params: { developer: "" } })).resolves.toBeTruthy();
  });
});
