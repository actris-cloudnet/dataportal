/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, Wrapper } from "@vue/test-utils";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import Vue from "vue";
import { augmentAxiosResponse, init } from "./lib";
import { findByUuid, readResources } from "../../shared/lib";
import { mocked } from "ts-jest/dist/util/testing";
import QualityReportView from "../src/views/QualityReport.vue";
import VueRouter from "vue-router";

init();

jest.mock("axios");

Vue.use(VueRouter);
const router = new VueRouter();

describe("QualityReport.vue", () => {
  let resources: any;
  let wrapper: Wrapper<Vue>;
  let content: string;

  beforeAll(async () => {
    resources = await readResources();
    const func = (url: string, _req: AxiosRequestConfig | undefined): AxiosPromise => {
      if (url.includes("quality")) {
        return Promise.resolve(augmentAxiosResponse(resources["quality-report"]));
      } else {
        return Promise.resolve(augmentAxiosResponse(findByUuid(resources["allfiles"], "acf")));
      }
    };
    mocked(axios.get).mockImplementation(func);
    wrapper = mount(QualityReportView, {
      propsData: { mode: "data" },
      router,
    });
  });

  beforeEach(async () => {
    await Vue.nextTick();
    content = wrapper.text();
  });

  it("shows file information", async () => {
    expect(content).toContain("20210126_bucharest_radar.nc");
    expect(content).toContain("Processed: 2021-02-22 10:39:58 UTC");
    expect(content).toContain("CloudnetPy version: 1.5.0");
  });

  it("shows failing tests", async () => {
    expect(content).toContain("Test failed without further details");
  });

  it("shows number of total tests", async () => {
    expect(content).toContain("63%");
    expect(content).toContain("13%");
    expect(content).toContain("25%");
    expect(content).toContain("Number of tests: 8");
    expect(content).toContain("Number of errors: 2");
    expect(content).toContain("Number of warnings: 1");
  });
});
