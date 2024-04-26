import { VueWrapper, mount } from "@vue/test-utils";
import App from "../src/App.vue";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { augmentAxiosResponse, nextTick } from "./lib";
import { findByUuid, readResources } from "../../shared/lib";
import { vi, describe, beforeAll, expect, it } from "vitest";
import { routes } from "../src/router";
import { createRouter, createWebHistory } from "vue-router";

vi.mock("axios");

const visualizationResponse = {
  sourceFileId: "62a702ca-318a-478d-8a32-842d4ec94a85",
  visualizations: [
    {
      filename: "20200503_bucharest_chm15k_beta.png",
      productVariable: {
        id: "lidar-beta",
        humanReadableName: "Attenuated backscatter coefficient",
        order: "0",
      },
    },
    {
      filename: "20200503_bucharest_chm15k_beta_raw.png",
      productVariable: {
        id: "lidar-beta_raw",
        humanReadableName: "Raw attenuated backscatter coefficient",
        order: "1",
      },
    },
  ],
  productHumanReadable: "Lidar",
  locationHumanReadable: "Bucharest",
};

let axiosMockWithFileUuid: Function;
let resources: any;

describe("FileView.vue", () => {
  beforeAll(async () => {
    resources = await readResources();
    axiosMockWithFileUuid = (uuid: string | string[]) => {
      let nreq = 0;
      return (url: string, _req: AxiosRequestConfig | undefined): AxiosPromise => {
        if (url.includes("visualization")) {
          return Promise.resolve(augmentAxiosResponse(visualizationResponse));
        } else if (url.includes("/sites")) {
          return Promise.resolve(augmentAxiosResponse(resources["sites"]));
        } else if (url.includes("/models")) {
          return Promise.resolve(augmentAxiosResponse(resources["models"]));
        } else if (url.match("/files/.*/versions")) {
          return Promise.resolve(
            augmentAxiosResponse([
              findByUuid(resources["allfiles"], "8bb"),
              findByUuid(resources["allfiles"], "6cb"),
              findByUuid(resources["allfiles"], "22b"),
            ]),
          );
        } else if (url.includes("/files")) {
          const i = Array.isArray(uuid) ? uuid[nreq] : uuid;
          nreq += 1;
          return Promise.resolve(augmentAxiosResponse(findByUuid(resources["allfiles"], i)));
        } else if (url.match("/reference")) {
          return Promise.resolve(augmentAxiosResponse("I'm a reference"));
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      };
    };
  });

  describe("volatile file", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("bde"));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "bde" } });
      await router.isReady();
    });

    it("displays a note on volatile file", async () => {
      expect(wrapper.find(".tags").text()).toContain("Volatile");
      expect(wrapper.text()).toContain("This data object is volatile and may be updated in the future.");
    });

    it("displays last modified date", async () => {
      expect(wrapper.text()).toContain("2020-02-20 10:56:19");
    });
  });

  describe("stable file", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid(["2bb", "1bb"]));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "6cb" } });
      await router.isReady();
    });

    it("does not display a note on stable file", () => {
      expect(wrapper.text()).not.toContain("volatile");
    });

    it("displays PID", () => {
      expect(wrapper.text()).toContain("http://pidservice.example/2bb");
    });

    it("displays links to source files", async () => {
      const html = wrapper.find(".data-sources").html();
      expect(html).toContain("Categorize");
      expect(html).toContain("/file/1bb32746-faf0-4057-9076-ed2e698dcf36");
    });
  });

  describe("legacy file", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("3bb"));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "3bb" } });
      await router.isReady();
    });

    it("displays a note on legacy file", () => {
      expect(wrapper.find(".tags").text()).toContain("Legacy");
      expect(wrapper.text()).toContain("This data object was produced using nonstandard processing.");
    });

    it("does not display source files", async () => {
      expect(wrapper.findAll(".source-files").length).toEqual(0);
    });
  });

  describe("versions", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routes,
    });
    let wrapper: VueWrapper;

    beforeAll(async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("3bb"));
    });

    it("displays link to next and newest version in oldest version", async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "22b" } });
      await router.isReady();
      await nextTick(3);

      const banner = wrapper.find(".banner");
      expect(banner.text()).toContain("There is a newer version of this data available.");
      expect(banner.find("a").attributes()["href"]).toBe("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");

      expect(wrapper.findAll("#previousVersion").length).toEqual(0);
      expect(wrapper.find("#nextVersion").attributes()["href"]).toBe("/file/6cb32746-faf0-4057-9076-ed2e698dcf36");
    });

    it("displays link to next, previous and newest version in second-to-newest version", async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("6cb"));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "6cb" } });
      await router.isReady();
      await nextTick(3);

      const banner = wrapper.find(".banner");
      expect(banner.text()).toContain("There is a newer version of this data available.");
      expect(banner.find("a").attributes()["href"]).toBe("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");

      expect(wrapper.find("#nextVersion").attributes()["href"]).toBe("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");
      expect(wrapper.find("#previousVersion").attributes()["href"]).toBe("/file/22b32746-faf0-4057-9076-ed2e698dcc34");
    });

    it("displays link to previous version in the newest version", async () => {
      vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("8bb"));
      wrapper = mount(App, { global: { plugins: [router] } });
      router.push({ name: "File", params: { uuid: "8bb" } });
      await router.isReady();
      await nextTick(3);
      expect(wrapper.findAll(".banner").length).toEqual(0);
      expect(wrapper.find("#previousVersion").attributes()["href"]).toBe("/file/6cb32746-faf0-4057-9076-ed2e698dcf36");
    });
  });
});
