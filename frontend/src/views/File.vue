<style scoped lang="sass">
@import "../sass/landing-beta.sass"
.landing-tags
  .tag
    display: flex
    justify-content: center
    align-items: center
    color: white
    font-size: 90%
    font-weight: 550
    inline-size: max-content
    block-size: min-content
    padding: 0.23*$basespacing 0.52*$basespacing
    border-radius: 2.5*$baseradius
    cursor: default
    &:first-child
      margin-left: $basespacing
    &:not(:first-child)
      margin-left: 0.7*$basespacing
  .experimental
    background-color: #EC9706
  .actris
    background-color: $actris-turquoise
  .volatile
    background-color: $BLUE-3-hex
  .legacy
    background-color: $GRAY-4-hex
</style>

<template>
  <main v-if="response" id="landing">
    <div v-if="!isBusy && newestVersion" class="landing-version-banner-container">
      <div class="landing-version-banner">
        There is a
        <router-link class="landing-version-banner-link" :to="`/file/${newestVersion}`">newer version</router-link>
        of this data available.
      </div>
    </div>
    <div class="landing-header-container">
      <div class="landing-title">
        {{ title }}
      </div>
      <div class="landing-tags">
        <div v-if="isActrisObject" class="tag actris" title="Data from an operational ACTRIS site">Actris</div>
        <div v-if="response.volatile" class="tag volatile" title="Data may change in future">Volatile</div>
        <div v-if="response.legacy" class="tag legacy" title="Produced using non-standardized processing">Legacy</div>
        <div v-if="response.product.experimental" class="tag experimental" title="Experimental product">
          Experimental
        </div>
      </div>
      <div class="landing-download">
        <DownloadButton :downloadUrl="response.downloadUrl" />
      </div>
      <div class="landing-subtitle">
        {{ humanReadableDate(response.measurementDate) }}
      </div>
    </div>
    <div class="tab-container">
      <router-link class="tab" :to="{ name: 'File' }">Summary</router-link>
      <router-link class="tab" :to="{ name: 'FileVisualizations' }"> Visualisations </router-link>
      <router-link class="tab" :to="{ name: 'FileQualityReport' }"> Quality report </router-link>
    </div>
    <div class="landing-content-background">
      <router-view
        :uuid="uuid"
        :response="response"
        :location="location"
        :instrument="instrument"
        :instrumentStatus="instrumentStatus"
        :isBusy="isBusy"
        :versions="versions"
        :sourceFiles="sourceFiles"
        :visualizations="visualizations"
        :loadingVisualizations="loadingVisualizations"
      />
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios from "axios";
import { humanReadableDate, sortVisualizations, fetchInstrumentName, compareValues } from "../lib";
import { DevMode } from "../lib/DevMode";
import { File, ModelFile, RegularFile } from "../../../backend/src/entity/File";
import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";
import HowToCite from "../components/HowToCite.vue";
import License from "../components/License.vue";
import Visualization from "../components/Visualization.vue";
import { Site, SiteType } from "../../../backend/src/entity/Site";
import { SiteLocation } from "../../../backend/src/entity/SiteLocation";
import { Model } from "../../../backend/src/entity/Model";

import FileInformation from "../components/landing/FileInformation.vue";
import ProductInformation from "../components/landing/ProductInformation.vue";
import DataOrigin from "../components/landing/DataOrigin.vue";
import Preview from "../components/landing/Preview.vue";
import Citation from "../components/landing/Citation.vue";
import DownloadButton from "../components/landing/DownloadButton.vue";

Vue.component("how-to-cite", HowToCite);
Vue.component("license", License);
Vue.component("visualization", Visualization);

export type SourceFile = { ok: true; value: File } | { ok: false; value: Error };

@Component({
  components: {
    FileInformation,
    ProductInformation,
    DataOrigin,
    Preview,
    Citation,
    DownloadButton,
  },
})
export default class FileView extends Vue {
  @Prop() uuid!: string;
  response: ModelFile | RegularFile | null = null;
  visualizations: VisualizationItem[] = [];
  versions: string[] = [];
  error = false;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  humanReadableDate = humanReadableDate;
  devMode = new DevMode();
  sourceFiles: SourceFile[] = [];
  showHowToCite = false;
  showLicense = false;
  isBusy = false;
  site!: Site;
  model: Model | null = null;
  instrument = "";
  instrumentStatus: "loading" | "error" | "ready" = "loading";
  loadingVisualizations = true;
  location: SiteLocation | null = null;

  metaInfo() {
    return { title: this.title };
  }

  get title() {
    if (!this.response) {
      return "Cloudnet Data Object";
    } else {
      return `${this.response.product.humanReadableName} data from ${this.response.site.humanReadableName}`;
    }
  }

  get isActrisObject() {
    if (!this.response) {
      return false;
    }
    return this.response.site.type.includes("cloudnet" as SiteType);
  }

  get currentVersionIndex() {
    if (this.response == null) return null;
    const response = this.response;
    return this.versions.findIndex((uuid) => uuid == response.uuid);
  }

  get newestVersion() {
    if (!this.currentVersionIndex) return null;
    return this.versions[0];
  }

  hideBoxes(e: MouseEvent) {
    let target = e.target as HTMLElement;
    const clickTargetId = target.id;

    if (["showLicense", "showCiting"].includes(clickTargetId)) return;

    // Check if clicked inside hoverbox
    let hoverboxClicked = false;
    while (!hoverboxClicked && target.parentElement) {
      if (target.parentElement.className == "hoverbox") hoverboxClicked = true;
      target = target.parentElement;
    }
    if (hoverboxClicked) return;

    this.showLicense = false;
    this.showHowToCite = false;
  }

  async created() {
    document.addEventListener("click", this.hideBoxes);
    await this.onUuidChange();
  }

  destroyed() {
    document.removeEventListener("click", this.hideBoxes);
  }

  async fetchVisualizations(payload: {}) {
    try {
      const response = await axios.get(`${this.apiUrl}visualizations/${this.uuid}`, payload);
      this.visualizations = sortVisualizations(response.data.visualizations);
    } catch (error) {
      console.error(error);
    }
    this.loadingVisualizations = false;
  }

  async fetchFileMetadata(payload: {}) {
    try {
      const response = await axios.get(`${this.apiUrl}files/${this.uuid}`, payload);
      this.response = response.data;
      if (this.response) {
        this.fetchLocation(this.response);
      }
    } catch (err) {
      this.error = true;
      this.response = err.response;
    }
  }

  async fetchLocation(file: ModelFile | RegularFile) {
    if (!file.site.type.includes("mobile" as SiteType)) {
      this.location = null;
      return;
    }
    try {
      const response = await axios.get(`${this.apiUrl}sites/${file.site.id}/locations/${file.measurementDate}`);
      this.location = response.data;
    } catch (err) {
      this.location = null;
    }
  }

  fetchVersions(file: File) {
    // No need to reload versions
    if (this.versions.includes(file.uuid)) return;
    const payload = {
      params: {
        developer: this.devMode.activated || undefined,
        filename: file.filename,
        allVersions: true,
        showLegacy: true,
      },
    };
    return axios.get(`${this.apiUrl}files`, payload).then((response) => {
      const searchFiles = response.data as File[];
      this.versions = searchFiles.map((sf) => sf.uuid);
    });
  }

  async fetchSourceFiles(response: RegularFile | ModelFile) {
    if (!("sourceFileIds" in response) || !response.sourceFileIds) {
      this.sourceFiles = [];
      return;
    }
    const results = await Promise.all(
      response.sourceFileIds.map((uuid) =>
        axios
          .get(`${this.apiUrl}files/${uuid}`)
          .then((response) => ({ ok: true, value: response.data }))
          .catch((error) => ({ ok: false, value: error }))
      )
    );
    results.sort((a, b) => {
      if (!a.ok || !b.ok) return -1;
      return compareValues(a.value.product.humanReadableName, b.value.product.humanReadableName);
    });
    this.sourceFiles = results;
  }

  @Watch("uuid")
  async onUuidChange() {
    this.isBusy = true;
    const payload = { params: { developer: this.devMode.activated || undefined } };
    await this.fetchFileMetadata(payload);
    if (this.response == null || this.error) return;
    await Promise.all([
      this.fetchInstrument(this.response),
      this.fetchVisualizations(payload),
      this.fetchVersions(this.response),
      this.fetchSourceFiles(this.response),
    ]);
    this.isBusy = false;
  }

  async fetchInstrument(file: RegularFile | ModelFile) {
    if (!("instrumentPid" in file) || file.instrumentPid == null) {
      return;
    }
    const pid = (file as RegularFile).instrumentPid;
    try {
      this.instrument = await fetchInstrumentName(pid);
      this.instrumentStatus = "ready";
    } catch (err) {
      console.error("Failed to load instrument:", err);
      this.instrumentStatus = "error";
    }
  }
}
</script>
