import { VueWrapper, mount } from "@vue/test-utils";
import FileView from "../src/views/FileView.vue";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { augmentAxiosResponse, nextTick } from "./lib";
import { findByUuid, readResources } from "../../shared/lib";
import { vi, describe, beforeAll, expect, it } from "vitest";

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
let wrapper: VueWrapper;

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
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      };
    };
  });
  // it("displays a note on volatile file", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("bde"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("This is a volatile file.");
  // });
  it("does not display a note on stable file", async () => {
    vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("6cb"));
    wrapper = mount(FileView, {
      props: { uuid: "6cb" },
      global: {
        stubs: ["router-link", "router-view"],
      },
    });
    await nextTick(1);
    expect(wrapper.text()).not.toContain("This is a volatile file.");
  });

  // it("displays a note on legacy file", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("3bb"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("This is legacy data.");
  // });

  // it("displays link to next and newest version in oldest version", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File);
  //   await nextTick(3);
  //   expect(wrapper.findAll("#previousVersion").length).toEqual(0);
  //   expect(wrapper.find("#nextVersion").html()).toContain("/file/6cb32746-faf0-4057-9076-ed2e698dcf36");
  //   expect(wrapper.find("#newestVersion").html()).toContain("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");
  // });
  //
  // it("displays link to next, previous and newest version in second-to-newest version", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("6cb"));
  //   wrapper = mountVue(File);
  //   await nextTick(3);
  //   expect(wrapper.find("#nextVersion").html()).toContain("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");
  //   expect(wrapper.find("#previousVersion").html()).toContain("/file/22b32746-faf0-4057-9076-ed2e698dcc34");
  //   expect(wrapper.find("#newestVersion").html()).toContain("/file/8bb32746-faf0-4057-9076-ed2e698dcf36");
  // });
  //
  // it("displays link to previous version in the newest version", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("8bb"));
  //   wrapper = mountVue(File);
  //   await nextTick(3);
  //   expect(wrapper.findAll("#newestVersion").length).toEqual(0);
  //   expect(wrapper.find("#previousVersion").html()).toContain("/file/6cb32746-faf0-4057-9076-ed2e698dcf36");
  // });
  //
  // it("displays last modified date", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("380"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   expect(wrapper.text()).toContain("2020-02-20 10:56:19 UTC");
  // });
  //
  // it("displays links to source files", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid(["2bb", "1bb"]));
  //   wrapper = mountVue(File);
  //   await nextTick(3);
  //   expect(wrapper.findAll("#history").length).toEqual(1);
  //   expect(wrapper.find("#history").html()).toContain("/file/1bb32746-faf0-4057-9076-ed2e698dcf36");
  // });

  it("does not display source file info where not applicable", async () => {
    vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("d21"));
    wrapper = mount(FileView, {
      props: { uuid: "d21" },
      global: {
        stubs: ["router-link", "router-view"],
      },
    });
    await nextTick(3);
    expect(wrapper.findAll(".sourceFileList").length).toEqual(0);
  });

  // it("shows how to cite box by clicking a button", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File, {
  //     stubs: { "router-link": true, "how-to-cite": HowToCite },
  //   });
  //   await nextTick(2);
  //   await wrapper.find("#showCiting").trigger("click");
  //   await nextTick(1);
  //   expect(wrapper.findAll("#howtocite").length).toEqual(1);
  //   expect(wrapper.text()).toContain("This is an example of how to cite Cloudnet datasets.");
  //   expect(wrapper.text()).toContain("Bucharest test citation.");
  // });
  //
  // it("hides how to cite box by clicking a button", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File, {
  //     stubs: { "router-link": true, "how-to-cite": HowToCite },
  //   });
  //   await nextTick(2);
  //   await wrapper.find("#showCiting").trigger("click");
  //   expect(wrapper.findAll("#howtocite").length).toEqual(1);
  //   await wrapper.find("#hideCiting").trigger("click");
  //   expect(wrapper.findAll("#howtocite").length).toEqual(0);
  // });
  //
  // it("shows licenseby clicking a button", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File, {
  //     stubs: { "router-link": true, license: License },
  //   });
  //   await nextTick(2);
  //   await wrapper.find("#showLicense").trigger("click");
  //   expect(wrapper.findAll("#license").length).toEqual(1);
  //   expect(wrapper.text()).toMatch(
  //     /.*Cloudnet data is licensed under a[\s\n]*Creative Commons Attribution 4\.0 international licence\..*/
  //   );
  // });
  //
  // it("hides license box by clicking a button", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File, {
  //     stubs: { "router-link": true, license: License },
  //   });
  //   await nextTick(2);
  //   await wrapper.find("#showLicense").trigger("click");
  //   expect(wrapper.findAll("#license").length).toEqual(1);
  //   await wrapper.find("#hideLicense").trigger("click");
  //   expect(wrapper.findAll("#license").length).toEqual(0);
  // });

  // it("displays a note on quality controlled file", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("acf"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("Quality Controlled (QC)");
  // });

  // it("displays a note on nrt file", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("22b"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("Near Real Time (NRT)");
  // });
  //
  // it("displays Pass on passing quality check", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("62b"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("Pass");
  // });
  //
  // it("displays Some problems on passing quality check", async () => {
  //   mocked(axios.get).mockImplementation(axiosMockWithFileUuid("acf"));
  //   wrapper = mountVue(File);
  //   await Vue.nextTick();
  //   return expect(wrapper.text()).toContain("Some issues");
  // });

  it("displays n/a on no quality check", async () => {
    vi.mocked(axios.get).mockImplementation(axiosMockWithFileUuid("72b"));
    wrapper = mount(FileView, {
      props: { uuid: "72b" },
      global: {
        stubs: ["router-link", "router-view"],
      },
    });
    await nextTick(1);
    expect(wrapper.text()).not.toContain("Some issues");
    expect(wrapper.text()).not.toContain("Pass");
  });
});
