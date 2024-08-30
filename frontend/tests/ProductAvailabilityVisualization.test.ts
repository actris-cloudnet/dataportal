import { VueWrapper, mount } from "@vue/test-utils";
import axios, { AxiosPromise } from "axios";
import { augmentAxiosResponse } from "./lib";
import { readResources } from "../../shared/lib";
import ProductAvailabilityVisualization from "../src/components/ProductAvailabilityVisualization.vue";
import { parseDataStatus } from "../src/lib/DataStatusParser";
import { vi, describe, beforeAll, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "../src/router";

vi.mock("axios");

let resources: any;
let wrapper: VueWrapper;
let props: any;

global.HTMLCanvasElement.prototype.getContext = (_contextId, _options) => null;

describe("Product availability visualization", () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  beforeAll(async () => {
    resources = await readResources();
    const axiosMock = (url: string): AxiosPromise => {
      if (url.includes("/api/product-availability")) {
        return Promise.resolve(augmentAxiosResponse(resources["productavailabilitysearch"]));
      } else if (url.includes("/api/products")) {
        return Promise.resolve(augmentAxiosResponse(resources["products"]));
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    };
    vi.mocked(axios.get).mockImplementation(axiosMock);
    const dataStatus = await parseDataStatus({ site: "palaiseau" });
    props = {
      siteId: "palaiseau",
      dataStatus,
    };
    wrapper = mount(ProductAvailabilityVisualization, { props, global: { plugins: [router] } });
  });

  it("displays years", () => {
    const years = wrapper.findAll(".year");
    expect(years).toHaveLength(1);
    expect(years[0].text()).toBe("2021");
  });

  it("shows legend", async () => {
    expect(wrapper.findAll(".legend-item")).toHaveLength(6);
  });
});
