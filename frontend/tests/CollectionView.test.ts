import { mount, VueWrapper } from "@vue/test-utils";
import CollectionView from "../src/views/CollectionView.vue";
import axios, { AxiosPromise } from "axios";
import { augmentAxiosResponse, nextTick } from "./lib";
import { readResources } from "../../shared/lib";

import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("axios");
vi.mock("vue-router", () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
}));

let mockAxios: Function;
let resources: any;
let wrapper: VueWrapper;

describe("CollectionView.vue", () => {
  beforeAll(async () => {
    resources = await readResources();
    mockAxios = () => {
      return (url: string): AxiosPromise => {
        if (url.includes("/collection/testuuid")) {
          return Promise.resolve(
            augmentAxiosResponse(resources["allcollections"][0])
          );
        } else if (url.includes("/search")) {
          return Promise.resolve(
            augmentAxiosResponse([
              resources["allsearch"][0],
              resources["allsearch"][8],
            ])
          );
        } else if (url.includes("/sites")) {
          return Promise.resolve(augmentAxiosResponse(resources["sites"]));
        } else if (url.includes("/products")) {
          return Promise.resolve(augmentAxiosResponse(resources["products"]));
        } else if (url.includes("/models")) {
          return Promise.resolve(augmentAxiosResponse(resources["models"]));
        } else if (url.includes("/generate-pid")) {
          return Promise.resolve(augmentAxiosResponse({ pid: "testpid" }));
        } else if (
          url.includes("/reference/testuuid?citation=true&format=html")
        ) {
          return Promise.resolve(
            augmentAxiosResponse(
              'Meikäläinen, M. (2023). Custom collection. <a href="">testpid</a>'
            )
          );
        } else if (
          url.includes("/reference/testuuid?acknowledgements=true&format=html")
        ) {
          return Promise.resolve(
            augmentAxiosResponse(
              "We acknowledge many people and organizations."
            )
          );
        } else if (
          url.includes("/reference/testuuid?dataAvailability=true&format=html")
        ) {
          return Promise.resolve(
            augmentAxiosResponse(
              "Only available in the amazing Cloudnet data portal."
            )
          );
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      };
    };
    vi.mocked(axios.get).mockImplementation(mockAxios());
    vi.mocked(axios.post).mockImplementation(mockAxios());
  });

  describe("general view", () => {
    beforeAll(async () => {
      wrapper = mount(CollectionView, {
        propsData: { uuid: "testuuid", mode: "general" },
        global: {
          stubs: ["router-link", "router-view"],
        },
      });
      await nextTick(1);
    });

    it("displays date span", () => {
      expect(wrapper.find("#summary").text()).toContain(
        "2014-12-05 - 2019-09-01"
      );
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
      await nextTick(2);
      expect(wrapper.text()).toContain("testpid");
    });

    it("displays license", async () => {
      await nextTick(2);
      expect(wrapper.text()).toMatch(
        /Cloudnet data is licensed under a[\s\n]*Creative Commons Attribution 4\.0 international licence\./
      );
    });

    it("displays custom citation info", async () => {
      await nextTick(2);
      expect(wrapper.text()).toContain(
        "Only available in the amazing Cloudnet data portal."
      );
      expect(wrapper.text()).toContain(
        "We acknowledge many people and organizations."
      );
      expect(wrapper.text()).toContain(
        "Meikäläinen, M. (2023). Custom collection. testpid"
      );
    });
  });

  describe("file view", () => {
    beforeAll(async () => {
      wrapper = mount(CollectionView, {
        propsData: { uuid: "testuuid", mode: "files" },
        global: {
          stubs: ["router-link", "router-view"],
        },
      });
      await nextTick(1);
    });

    it("displays a list of files", () => {
      expect(wrapper.text()).toContain("Radar from Hyytiälä");
      expect(wrapper.text()).toContain("Model from Mace Head");
    });
  });
});
