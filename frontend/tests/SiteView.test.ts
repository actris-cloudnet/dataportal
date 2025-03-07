import { VueWrapper, mount } from "@vue/test-utils";
import axios, { AxiosPromise } from "axios";
import { augmentAxiosResponse, nextTick } from "./lib";
import { readResources } from "../../shared/lib";
import SiteView from "../src/views/SiteView.vue";
import { vi, describe, beforeAll, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "../src/router";

vi.mock("axios");

let axiosMockWithIdx: (siteIdx: number, searchIdx: number, instruments?: any[]) => (url: string) => AxiosPromise;
let resources: any;
let wrapper: VueWrapper;
const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

describe("SiteView.vue", () => {
  beforeAll(async () => {
    resources = await readResources();
    axiosMockWithIdx =
      (siteIdx, searchIdx, instruments = []) =>
      (url: string) => {
        if (url.includes("/api/product-availability")) {
          return Promise.resolve(augmentAxiosResponse(resources["productavailability"]));
        } else if (url.includes("/api/sites")) {
          return Promise.resolve(augmentAxiosResponse(resources["sites"][siteIdx]));
        } else if (url.includes("/api/search")) {
          return Promise.resolve(augmentAxiosResponse([resources["allsearch"][searchIdx]]));
        } else if (url.includes("/api/uploaded-metadata")) {
          return Promise.resolve(augmentAxiosResponse(instruments));
        } else if (url.includes("/api/products")) {
          return Promise.resolve(augmentAxiosResponse(resources["products"]));
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      };
  });

  it.skip("displays basic information", async () => {
    const expected = ["Bucharest, Romania", "44.348°N, 26.029°E", "93 m", "2019-07-16"];
    vi.mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 7));
    wrapper = mount(SiteView, { props: { siteId: "bucharest" }, global: { plugins: [router] } });
    await nextTick(50);
    const summaryText = wrapper.find("#summary").text();
    expected.forEach((str) => expect(summaryText).toContain(str));
  });

  it.skip("displays negative coordinate information", async () => {
    const expected = ["Mace Head", "53.326°N, 9.9°W", "16 m", "2019-07-16"];
    vi.mocked(axios.get).mockImplementation(axiosMockWithIdx(1, 7));
    wrapper = mount(SiteView, { props: { siteId: "mace-head" }, global: { plugins: [router] } });
    await nextTick(50);
    const summaryText = wrapper.find("#summary").text();
    expected.forEach((str) => expect(summaryText).toContain(str));
  });

  it.skip("displays instruments when they are found", async () => {
    const expected = ["Lufft CHM15k ceilometer", "METEK MIRA-35 cloud radar"];
    vi.mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 7, resources["uploaded-metadata-public"]));
    wrapper = mount(SiteView, { props: { siteId: "whatever" }, global: { plugins: [router] } });
    await nextTick(50);
    const instrumentText = wrapper.find("#instruments").text();
    expected.forEach((str) => expect(instrumentText).toContain(str));
  });

  it.skip("displays notification when instruments are not found", async () => {
    vi.mocked(axios.get).mockImplementation(axiosMockWithIdx(1, 0));
    wrapper = mount(SiteView, { props: { siteId: "whatever" }, global: { plugins: [router] } });
    await nextTick(50);
    const instrumentText = wrapper.find("#instruments").text();
    expect(instrumentText).toContain("No data received in the last");
  });

  it.skip("fetches instruments from last n days", async () => {
    const expectedString = "The site has submitted data from the following instruments in the last";
    vi.mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 8, resources["uploaded-metadata-public"]));
    wrapper = mount(SiteView, { props: { siteId: "whatever" }, global: { plugins: [router] } });
    await nextTick(50);
    const instrumentText = wrapper.find("#instruments").text();
    expect(instrumentText).toContain(expectedString);
    const instrumentTextClean = instrumentText.replace(/\s+/g, " ");
    const nDaysRe =
      /^Instruments The site has submitted data from the following instruments in the last ([0-9]+) days:.*$/;
    const nDaysMatch = instrumentTextClean.match(nDaysRe);
    const nDays = nDaysMatch ? parseInt(nDaysMatch[1]) : undefined;
    const date30daysago = new Date();
    expect(nDays).toBeDefined();

    date30daysago.setDate(date30daysago.getDate() - nDays!);
    const call = vi.mocked(axios.get).mock.calls.find((call) => call[0].includes("/uploaded-metadata/"));
    expect(call).toBeDefined();
    // Expect to be within 5 seconds
    expect(new Date(call![1]?.params.updatedAtFrom).getTime() / 1000).toBeCloseTo(date30daysago.getTime() / 1000, -1);
  });
});
