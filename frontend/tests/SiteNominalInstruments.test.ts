import { VueWrapper, mount } from "@vue/test-utils";
import axios from "axios";
import { augmentAxiosResponse, nextTick } from "./lib";
import SiteNominalInstruments from "../src/components/site/SiteNominalInstruments.vue";
import { loginStore } from "../src/lib/auth";
import { vi, describe, beforeEach, afterEach, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "../src/router";

vi.mock("axios");

const router = createRouter({ history: createWebHistory(), routes });

const site = { id: "lindenberg", humanReadableName: "Lindenberg" } as any;

const products = [
  { id: "lidar", humanReadableName: "Lidar", type: ["instrument"] },
  { id: "mwr", humanReadableName: "Microwave radiometer", type: ["instrument"] },
  { id: "classification", humanReadableName: "Classification", type: ["geophysical"] },
];

const instrument = (uuid: string, name: string, serial: string | null, type = "mwr") => ({
  uuid,
  name,
  model: "Model X",
  serialNumber: serial,
  instrument: { id: "hatpro", type, humanReadableName: "HATPRO" },
});

const nominal = [
  {
    siteId: "lindenberg",
    productId: "mwr",
    measurementDate: "2022-02-25",
    nominalInstrument: instrument("b", "DWD HATPRO-G5", "0193"),
  },
  {
    siteId: "lindenberg",
    productId: "mwr",
    measurementDate: "2020-01-05",
    nominalInstrument: instrument("a", "DWD HATPRO-G5", "0126"),
  },
  {
    siteId: "lindenberg",
    productId: "lidar",
    measurementDate: "2999-09-01",
    nominalInstrument: instrument("d", "DWD CL61", null, "lidar"),
  },
  {
    siteId: "lindenberg",
    productId: "lidar",
    measurementDate: "2020-01-01",
    nominalInstrument: instrument("c", "DWD CHM 15k", "CHM100110", "lidar"),
  },
];

function mockAxios() {
  vi.mocked(axios.get).mockImplementation((url: string) => {
    if (url.includes("/api/products")) return Promise.resolve(augmentAxiosResponse(products));
    if (url.includes("/nominal-instruments")) return Promise.resolve(augmentAxiosResponse(nominal));
    if (url.includes("/api/instrument-pids")) return Promise.resolve(augmentAxiosResponse([]));
    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  });
}

let wrapper: VueWrapper;

describe("SiteNominalInstruments.vue", () => {
  beforeEach(() => {
    mockAxios();
    loginStore.permissions = [];
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("groups entries by product with derived periods and status pills", async () => {
    wrapper = mount(SiteNominalInstruments, { props: { site }, global: { plugins: [router] } });
    await nextTick(50);
    const rows = wrapper.findAll("tbody tr");
    const cells = (r: any) =>
      r
        .findAll("td")
        .map((td: any) => td.text().replace(/\s+/g, " ").trim())
        .join(" | ");
    expect(rows.map(cells)).toEqual([
      "Lidar",
      "DWD CL61Scheduled | 2999-09-01 | now",
      "DWD CHM 15kCHM100110Current | 2020-01-01 | 2999-08-31",
      "Microwave radiometer",
      "DWD HATPRO-G50193Current | 2022-02-25 | now",
      "DWD HATPRO-G50126 | 2020-01-05 | 2022-02-24",
    ]);
    expect(wrapper.text()).not.toContain("Add nominal instrument");
    expect(wrapper.findAll("button").length).toBe(0);
  });

  it("shows management controls only with permission", async () => {
    loginStore.permissions = [{ id: 1, permission: "canManageNominalInstruments", site: null }];
    wrapper = mount(SiteNominalInstruments, { props: { site }, global: { plugins: [router] } });
    await nextTick(50);
    expect(wrapper.text()).toContain("Add nominal instrument");
    expect(wrapper.findAll("tbody tr:not(.group) button").length).toBe(8);
  });

  it("shows empty state", async () => {
    vi.mocked(axios.get).mockImplementation((url: string) => {
      if (url.includes("/api/products")) return Promise.resolve(augmentAxiosResponse(products));
      return Promise.resolve(augmentAxiosResponse([]));
    });
    wrapper = mount(SiteNominalInstruments, { props: { site }, global: { plugins: [router] } });
    await nextTick(50);
    expect(wrapper.text()).toContain("No nominal instruments set for this site.");
  });
});
