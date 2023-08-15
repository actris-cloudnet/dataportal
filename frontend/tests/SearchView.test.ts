import { mount, VueWrapper } from "@vue/test-utils";
import SearchView from "../src/views/SearchView.vue";
import axios, { AxiosPromise } from "axios";
import {
  augmentAxiosResponse,
  dateFromPast,
  dateToISOString,
  getMockedAxiosLastCallSecondArgument,
  nextTick,
  tomorrow,
  wait,
} from "./lib";
import { readResources } from "../../shared/lib";
import { vi, describe, beforeAll, expect, it } from "vitest";
import router from "../src/router";

vi.mock("axios");

const date = new Date();
const dateFromDefault = date.toISOString().substring(0, 10);
const dateToDefault = new Date().toISOString().substring(0, 10);
let filesSortedByDate: any;

// https://github.com/jsdom/jsdom/issues/3368
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("SearchView.vue", () => {
  let wrapper: VueWrapper;
  let resources: any;

  const findInputByName = (inputName: string) =>
    wrapper.find(`input[name="${inputName}"]`);
  const findElementById = (id: string) => wrapper.find(`#${id}`);
  const getInputValueByName = (inputName: string) =>
    (wrapper.find(`input[name="${inputName}"]`).element as HTMLInputElement)
      .value;

  const changeInputAndNextTick = async (
    inputName: string,
    newValue: string
  ) => {
    const input = findInputByName(inputName);
    const inputElement = input.element as HTMLInputElement;
    inputElement.value = newValue;
    await input.trigger("change");
    await nextTick(1);
  };

  beforeAll(async () => {
    resources = await readResources();
    filesSortedByDate = resources["allfiles"].sort(
      (a: any, b: any) =>
        new Date(a.measurementDate).getTime() -
        new Date(b.measurementDate).getTime()
    );
    const defaultAxiosMock = (url: string): AxiosPromise => {
      if (url.includes("/files")) {
        return Promise.resolve(augmentAxiosResponse(resources["allfiles"]));
      } else if (url.includes("/sites")) {
        // sites
        return Promise.resolve(augmentAxiosResponse(resources["sites"]));
      } else if (url.includes("/search")) {
        // search
        return Promise.resolve(augmentAxiosResponse(resources["allsearch"]));
      } else if (url.includes("/products")) {
        return Promise.resolve(
          augmentAxiosResponse(resources["products-with-variables"])
        );
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    };
    vi.mocked(axios.get).mockImplementation(defaultAxiosMock);

    router.push("/search/data");
    await router.isReady();

    wrapper = mount(SearchView, {
      propsData: { mode: "data" },
      stubs: ["SuperMap"],
      global: { plugins: [router] },
    });
  });

  it("makes less than 7 api request on mount", () => {
    // files and sites
    expect(vi.mocked(axios.get).mock.calls.length).toBeLessThan(7);
  });

  describe("date selectors", () => {
    it("has today as the default dateTo", () => {
      expect(getInputValueByName("dateTo")).toBe(dateToDefault);
    });

    it("sets correct date ranges from quickselector buttons", async () => {
      await findElementById("weekBtn").trigger("click");
      expect(
        (wrapper.find("#showDateRangeCheckbox").element as HTMLInputElement)
          .checked
      ).toBe(false);
      expect(wrapper.find("#dateFrom").exists()).toBe(false);
      expect(getInputValueByName("dateTo")).toBe(dateToDefault);
      await findElementById("yearBtn").trigger("click");
      const year = new Date().getFullYear();
      expect(
        (wrapper.find("#showDateRangeCheckbox").element as HTMLInputElement)
          .checked
      ).toBe(true);
      expect(getInputValueByName("dateFrom")).toBe(`${year}-01-01`);
      expect(getInputValueByName("dateTo")).toBe(dateToDefault);
      await findElementById("monthBtn").trigger("click");
      expect(
        (wrapper.find("#showDateRangeCheckbox").element as HTMLInputElement)
          .checked
      ).toBe(true);
      expect(getInputValueByName("dateFrom")).toBe(dateFromPast(29));
      expect(getInputValueByName("dateTo")).toBe(dateToDefault);
    });

    it("displays data objects between dateFrom and dateTo by default", () => {
      // Has to be sliced because only 10 results are shown before pagination
      resources["allsearch"]
        .slice(0, 10)
        .map((file: any) => file.measurementDate)
        .forEach((date: any) => expect(wrapper.text()).toContain(date));
    });

    it("fetches updated list of files from api on dateFrom change", async () => {
      const newValue = filesSortedByDate[1].measurementDate;
      await changeInputAndNextTick("dateFrom", newValue);
      const secondArg = getMockedAxiosLastCallSecondArgument();
      expect(dateToISOString(secondArg.params.dateFrom)).toEqual(newValue);
    });

    it("Inserts correct parameters to url query string", async () => {
      const dateFrom = "2019-01-01";
      const dateTo = "2020-01-01";
      await changeInputAndNextTick("dateFrom", dateFrom);
      await changeInputAndNextTick("dateTo", dateTo);
      await nextTick(10);
      expect(router.currentRoute.value.query).toEqual({ dateFrom, dateTo });
    });

    it("fetches updated list of files from api on dateTo change", async () => {
      const newValue = filesSortedByDate[3].measurementDate;
      await changeInputAndNextTick("dateTo", newValue);
      const secondArg = getMockedAxiosLastCallSecondArgument();
      expect(dateToISOString(secondArg.params.dateTo)).toEqual(newValue);
    });

    it("updates table based on api response", async () => {
      vi.mocked(axios.get).mockImplementationOnce(() =>
        Promise.resolve(augmentAxiosResponse(resources["allsearch"].slice(3)))
      );
      const newValue = filesSortedByDate[0].measurementDate;
      await changeInputAndNextTick("dateFrom", newValue);
      await wait(100);
      // Contains the dates of all files except the first
      resources["allsearch"]
        .slice(3)
        .map((file: any) => file.measurementDate)
        .forEach((date: any) => expect(wrapper.text()).toContain(date));
      expect(wrapper.text()).not.toContain(
        resources["allsearch"][0].measurementDate
      );
      expect(wrapper.text()).not.toContain(
        resources["allsearch"][1].measurementDate
      );
      expect(wrapper.text()).not.toContain(
        resources["allsearch"][2].measurementDate
      );
    });

    it("does not touch API on invalid input", async () => {
      const numberOfCallsBefore = vi.mocked(axios.get).mock.calls.length;
      const newValue = "asdf";
      await changeInputAndNextTick("dateTo", newValue);
      await changeInputAndNextTick("dateFrom", newValue);
      const numberOfCallsAfter = vi.mocked(axios.get).mock.calls.length;
      expect(numberOfCallsBefore).toEqual(numberOfCallsAfter);
    });

    it("displays error when inserting invalid input", async () => {
      const newValue = "asdf";
      await changeInputAndNextTick("dateTo", newValue);
      await changeInputAndNextTick("dateFrom", newValue);
      expect(wrapper.text()).toContain("Invalid input");
      expect(findElementById("dateTo").classes()).toContain("error");
      expect(findElementById("dateFrom").classes()).toContain("error");
    });

    it("resets error when replacing invalid input with valid", async () => {
      const newValue = "asdf";
      await changeInputAndNextTick("dateTo", newValue);
      await changeInputAndNextTick("dateFrom", newValue);
      await changeInputAndNextTick("dateFrom", "2018-09-01");
      await changeInputAndNextTick("dateTo", "2018-09-02");
      expect(wrapper.text()).not.toContain("Invalid input");
      expect(findElementById("dateTo").classes()).not.toContain("error");
      expect(findElementById("dateFrom").classes()).not.toContain("error");
    });

    it("displays error if date is in the future", async () => {
      await changeInputAndNextTick("dateFrom", dateToISOString(tomorrow()));
      await changeInputAndNextTick("dateTo", dateToISOString(tomorrow()));
      expect(wrapper.text()).toContain("Provided date is in the future.");
      expect(findElementById("dateFrom").classes()).toContain("error");
      expect(findElementById("dateTo").classes()).toContain("error");
    });

    it("displays error if dateFrom is later than dateTo", async () => {
      await changeInputAndNextTick("dateFrom", "2018-09-02");
      await changeInputAndNextTick("dateTo", "2018-09-01");
      expect(wrapper.text()).toContain("Start date must be before end date.");
      expect(findElementById("dateFrom").classes()).toContain("error");
      expect(findElementById("dateTo").classes()).toContain("error");
    });
  });

  describe("volatility", () => {
    it("displays volatile label only next to volatile items", async () => {
      expect(findElementById("tableContent").findAll(".volatile")).toHaveLength(
        4
      );
    });
  });

  describe("legacy", () => {
    it("makes correct query to backend", async () => {
      const calls = vi.mocked(axios.get).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]).toMatchObject({ params: { showLegacy: true } });
    });

    it("displays legacy label next to volatile items", async () => {
      expect(findElementById("tableContent").findAll(".legacy")).toHaveLength(
        1
      );
    });
  });

  describe("experimental products", () => {
    it("fetches experimental products when clicking show exp prods checkbox", async () => {
      let calls = vi.mocked(axios.get).mock.calls;
      let lastCall = calls[calls.length - 1][1] as any;
      expect(lastCall.params.product).not.toContain("l3-cf");
      await findElementById("showExpProductsCheckbox").setValue();
      await nextTick(1);
      calls = vi.mocked(axios.get).mock.calls;
      lastCall = calls[calls.length - 1][1] as any;
      expect(lastCall.params.product).toContain("l3-cf");
    });
  });
});
