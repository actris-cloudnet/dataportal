/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wrapper } from "@vue/test-utils";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import Vue from "vue";
import { augmentAxiosResponse, getMockedAxiosLastCallSecondArgument, init, mountVue, nextTick } from "./lib";
import { mocked } from "ts-jest/dist/util/testing";
import { readResources } from "../../shared/lib";
import Site from "../src/views/Site.vue";

init();

jest.mock("axios");

let axiosMockWithIdx: Function;
let resources: any;
let wrapper: Wrapper<Vue>;

describe("Site.vue", () => {
  beforeAll(async () => {
    resources = await readResources();
    axiosMockWithIdx = (siteIdx: number, searchIdx: number, instruments = []) => {
      return (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
        if (url.includes("site")) {
          return Promise.resolve(augmentAxiosResponse(resources["sites"][siteIdx]));
        } else if (url.includes("search")) {
          return Promise.resolve(augmentAxiosResponse([resources["allsearch"][searchIdx]]));
        } else {
          // metadata-upload
          return Promise.resolve(augmentAxiosResponse(instruments));
        }
      };
    };
  });

  it("displays basic information", async () => {
    const expected = ["Bucharest, Romania", "44.348°\u00a0N, 26.029°\u00a0E", "93 m", "2019-07-16"];
    mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 7));
    wrapper = mountVue(Site);
    await nextTick(1);
    const summaryText = await wrapper.find("#summary").text();
    return expected.forEach((str) => expect(summaryText).toContain(str));
  });

  it("displays negative coordinate information", async () => {
    const expected = ["Mace Head", "53.326°\u00a0N, 9.9°\u00a0W", "16 m", "2019-07-16"];
    mocked(axios.get).mockImplementation(axiosMockWithIdx(1, 7));
    wrapper = mountVue(Site);
    await nextTick(1);
    const summaryText = await wrapper.find("#summary").text();
    return expected.forEach((str) => expect(summaryText).toContain(str));
  });

  it("displays instruments when they are found", async () => {
    const expected = ["Lufft CHM15k ceilometer", "METEK MIRA-35 cloud radar"];
    mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 7, resources["uploaded-metadata-public"]));
    wrapper = mountVue(Site);
    await nextTick(1);
    const instrumentText = await wrapper.find("#instruments").text();
    return expected.forEach((str) => expect(instrumentText).toContain(str));
  });

  it("displays notification when instruments are not found", async () => {
    mocked(axios.get).mockImplementation(axiosMockWithIdx(1, 0));
    wrapper = mountVue(Site);
    await nextTick(1);
    const instrumentText = await wrapper.find("#instruments").text();
    return expect(instrumentText).toContain("not available");
  });

  it("fetches instruments from last n days", async () => {
    const expectedString = "The site has submitted data from the following instruments in the last";
    const parseDaysFromInstrumentString = (instrumentString: string) =>
      parseInt(instrumentString.split(expectedString)[1].split(" ")[1]);
    mocked(axios.get).mockImplementation(axiosMockWithIdx(0, 8, resources["uploaded-metadata-public"]));
    wrapper = mountVue(Site);
    await nextTick(1);
    const instrumentText = await wrapper.find("#instruments").text();
    expect(instrumentText).toContain(expectedString);
    const instrumentTextClean = instrumentText.replace(/\s+/g, " ");
    const nDaysRe =
      /^Instruments The site has submitted data from the following instruments in the last ([0-9]+) days:.*$/;
    const nDaysMatch = instrumentTextClean.match(nDaysRe);
    const nDays = nDaysMatch ? parseInt(nDaysMatch[1]) : undefined;
    const date30daysago = new Date();
    expect(nDays).toBeDefined();
    date30daysago.setDate(date30daysago.getDate() - nDays!);
    const secondArg = getMockedAxiosLastCallSecondArgument();
    // Expect to be within 5 seconds
    return expect(new Date(secondArg.params.dateFrom).getTime() / 1000).toBeCloseTo(date30daysago.getTime() / 1000, -1);
  });
});
