import { VueWrapper, mount } from "@vue/test-utils";
import axios, { AxiosPromise } from "axios";
import { augmentAxiosResponse, nextTick, wait } from "./lib";
import { readResources } from "../../shared/lib";
import DataStatusVisualization from "../src/components/DataStatusVisualization.vue";
import { parseDataStatus } from "../src/lib/DataStatusParser";
import { vi, describe, beforeAll, expect, it } from "vitest";

vi.mock("axios");

let resources: any;
let wrapper: VueWrapper;
let props: any;

const getLiWrappers = (element: VueWrapper) =>
  element.findAll(".dataviz-tooltip li.productitem");

const getColorElementByDate = (wrapper: VueWrapper, date: string) => {
  const element = wrapper.find(`#dataviz-color-${date}`);
  return { element, classes: element.classes() };
};

describe("Data availability mode", () => {
  beforeAll(async () => {
    resources = await readResources();
    const axiosMock = (url: string): AxiosPromise => {
      if (url.includes("/search")) {
        return Promise.resolve(
          augmentAxiosResponse(resources["productavailabilitysearch"])
        );
      } else if (url.includes("/product")) {
        return Promise.resolve(augmentAxiosResponse(resources["products"]));
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    };
    vi.mocked(axios.get).mockImplementation(axiosMock);
    const properties = ["measurementDate", "productId", "legacy", "errorLevel"];
    const searchPayload = {
      site: "palaiseau",
      legacy: true,
      developer: false,
      properties,
    };
    const dataStatus = await parseDataStatus(searchPayload);
    props = {
      site: "palaiseau",
      legend: true,
      tooltips: true,
      qualityScores: false,
      debounceMs: 0,
      dataStatus,
    };
    wrapper = mount(DataStatusVisualization, { propsData: props });
    await nextTick(1);
  });

  it("displays green color for days that have all data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-05");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every(
        (wrap) =>
          wrap.text().includes("Disdrometer") ||
          wrap.classes().includes("found")
      )
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("all-data");
  });

  it("displays light green color for days that have incomplete data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-04");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => {
        const wrapClasses = wrap.classes();
        return wrap.text().includes("Classification") ||
          wrap.text().includes("Disdrometer")
          ? !wrapClasses.includes("found")
          : wrapClasses.includes("found");
      })
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("all-raw");
  });

  it("displays dark gray color for days that have only legacy data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-03");
    await element.trigger("mouseenter");
    await wait(500);
    const supWrappers = wrapper.findAll(".dataviz-tooltip sup");
    expect(
      getLiWrappers(wrapper).every((wrap) => {
        const wrapClasses = wrap.classes();
        return wrap.text().includes("Classification")
          ? wrapClasses.includes("found")
          : !wrapClasses.includes("found");
      })
    ).toBeTruthy();
    expect(supWrappers.length).toEqual(1);
    expect(classes.length).toEqual(2);
    expect(classes).toContain("only-legacy-data");
  });

  it("displays light gray color for days that have only model data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-02");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => {
        const wrapClasses = wrap.classes();
        return wrap.text().includes("Model")
          ? wrapClasses.includes("found")
          : !wrapClasses.includes("found");
      })
    );
    expect(classes.length).toEqual(2);
    expect(classes).toContain("only-model-data");
  });

  it("displays white color for days that have no data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-01");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => !wrap.classes().includes("found"))
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("no-data");
  });

  it("hides tooltips on tooltips=false", async () => {
    const customWrapper = mount(DataStatusVisualization, {
      propsData: { ...props, tooltips: false },
    });
    await nextTick(1);
    const { element } = getColorElementByDate(customWrapper, "2021-05-05");
    expect(getLiWrappers(element).length).toEqual(0);
  });

  it("shows legend on legend=true", async () => {
    expect(wrapper.findAll(".dav-legend")).toHaveLength(1);
  });

  it("hides legend on legend=false", async () => {
    const customWrapper = mount(DataStatusVisualization, {
      propsData: { ...props, legend: false },
    });
    await nextTick(1);
    expect(customWrapper.findAll(".dav-legend")).toHaveLength(0);
  });
});

describe("Data quality mode", () => {
  beforeAll(async () => {
    resources = await readResources();
    const axiosMock = (url: string): AxiosPromise => {
      if (url.includes("search")) {
        return Promise.resolve(
          augmentAxiosResponse(resources["productavailabilitysearch"])
        );
      } else {
        return Promise.resolve(augmentAxiosResponse(resources["products"]));
      }
    };
    vi.mocked(axios.get).mockImplementation(axiosMock);
    const properties = ["measurementDate", "productId", "legacy", "errorLevel"];
    const searchPayload = {
      site: "palaiseau",
      legacy: true,
      properties,
    };
    const dataStatus = await parseDataStatus(searchPayload);
    props = {
      site: "whatever",
      legend: true,
      tooltips: true,
      qualityScores: true,
      debounceMs: 0,
      dataStatus,
    };
    wrapper = mount(DataStatusVisualization, { propsData: props });
    await nextTick(1);
  });

  it("displays green color for days for which all tests pass", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-06");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every(
        (wrap) =>
          wrap.text().includes("Disdrometer") ||
          wrap.classes().includes("found")
      )
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("all-data");
  });

  it("displays yellow color for days for which some tests fail", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-05");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => {
        const wrapClasses = wrap.classes();
        return wrap.text().includes("Model") ||
          wrap.text().includes("Disdrometer")
          ? !wrapClasses.includes("found")
          : wrapClasses.includes("found");
      })
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("all-data");
  });

  it("displays light gray color for days that have no qc tests", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-04");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => {
        const wrapClasses = wrap.classes();
        return wrapClasses.includes("na");
      })
    );
    expect(classes.length).toEqual(2);
  });

  it("displays white color for days that have no data", async () => {
    const { element, classes } = getColorElementByDate(wrapper, "2021-05-01");
    await element.trigger("mouseenter");
    await wait(50);
    expect(
      getLiWrappers(wrapper).every((wrap) => !wrap.classes().includes("found"))
    ).toBeTruthy();
    expect(classes.length).toEqual(2);
    expect(classes).toContain("no-data");
  });

  it("shows correct legend on legend=true", async () => {
    expect(wrapper.find(".dav-legend").text()).toContain("L2 pass");
  });
});
