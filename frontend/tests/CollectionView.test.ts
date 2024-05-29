import { mount, VueWrapper } from "@vue/test-utils";
import axios, { AxiosPromise } from "axios";
import { augmentAxiosResponse } from "./lib";
import { readResources } from "../../shared/lib";
import { routes } from "../src/router";
import App from "../src/App.vue";

import { beforeAll, describe, expect, it, vi } from "vitest";
import { createRouter, createWebHistory } from "vue-router";

vi.mock("axios");

let mockAxios: Function;
let resources: any;

describe("CollectionView.vue", () => {
  beforeAll(async () => {
    resources = await readResources();
    mockAxios = () => {
      return (url: string): AxiosPromise => {
        if (url.includes("/collection/testuuid")) {
          return Promise.resolve(augmentAxiosResponse(resources["allcollections"][0]));
        } else if (url.includes("/search")) {
          return Promise.resolve(augmentAxiosResponse([resources["allsearch"][0], resources["allsearch"][8]]));
        } else if (url.includes("/sites")) {
          return Promise.resolve(augmentAxiosResponse(resources["sites"]));
        } else if (url.includes("/products")) {
          return Promise.resolve(augmentAxiosResponse(resources["products"]));
        } else if (url.includes("/models")) {
          return Promise.resolve(augmentAxiosResponse(resources["models"]));
        } else if (url.includes("/generate-pid")) {
          return Promise.resolve(augmentAxiosResponse({ pid: "testpid" }));
        } else if (url.includes("/reference/") && url.includes("/citation?format=html")) {
          return Promise.resolve(
            augmentAxiosResponse('Meikäläinen, M. (2023). Custom collection. <a href="">testpid</a>'),
          );
        } else if (url.includes("/reference/") && url.includes("/acknowledgements?format=html")) {
          return Promise.resolve(augmentAxiosResponse("We acknowledge many people and organizations."));
        } else if (url.includes("/reference/") && url.includes("/data-availability?format=html")) {
          return Promise.resolve(augmentAxiosResponse("Only available in the amazing Cloudnet data portal."));
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      };
    };
    vi.mocked(axios.get).mockImplementation(mockAxios());
    vi.mocked(axios.post).mockImplementation(mockAxios());
  });

  describe("summary view", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "Collection", params: { uuid: "testuuid" } });
      await router.isReady();
    });

    it("displays date span", () => {
      expect(wrapper.find("#summary").text()).toContain("2014-12-05 – 2019-09-01");
    });

    it("displays size", () => {
      expect(wrapper.find("#summary").text()).toContain("15.8 MB");
    });

    it("displays file number", () => {
      expect(wrapper.find("#summary").text()).toContain("2");
    });

    it("displays products", () => {
      expect(wrapper.find("#products").text()).toContain("Radar");
      expect(wrapper.find("#products").text()).toContain("Model");
    });

    it("displays products", () => {
      expect(wrapper.find("#products").text()).toContain("Radar");
      expect(wrapper.find("#products").text()).toContain("Model");
    });

    it("displays PID", async () => {
      expect(wrapper.text()).toContain("testpid");
    });

    it("displays license", async () => {
      expect(wrapper.text()).toMatch(/Cloudnet data is licensed under\s+CC BY 4\.0/);
    });

    it("displays custom citation info", async () => {
      expect(wrapper.text()).toContain("Only available in the amazing Cloudnet data portal.");
      expect(wrapper.text()).toContain("We acknowledge many people and organizations.");
      expect(wrapper.text()).toContain("Meikäläinen, M. (2023). Custom collection. testpid");
    });
  });

  describe("file view", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "CollectionFiles", params: { uuid: "testuuid" } });
      await router.isReady();
    });

    it("displays a list of files", () => {
      expect(wrapper.text()).toContain("Radar from Hyytiälä");
      expect(wrapper.text()).toContain("Model from Mace Head");
    });
  });
});
