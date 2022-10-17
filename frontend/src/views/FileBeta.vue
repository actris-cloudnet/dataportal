<style scoped lang="sass">
@import "../sass/landing-beta.sass"
</style>

<template>
  <main v-if="response" id="landing">
    <div class="landing-beta-banner-container">
      <div class="landing-beta-banner">Beta version. Page is still under development.</div>
    </div>
    <div v-if="!isBusy && newestVersion" class="landing-version-banner-container">
      <router-link class="landing-version-banner" :to="`/beta/file/${newestVersion}`"
        >New version of the file available</router-link
      >
    </div>
    <div class="landing-header-container">
      <div class="landing-title">
        {{ response.product.humanReadableName }}
        data from
        {{ response.site.humanReadableName }}
      </div>
      <div class="landing-tags">
        <div v-if="response.volatile" class="tag volatile">volatile file</div>
        <div v-if="response.legacy" class="tag legacy">legacy file</div>
      </div>
      <div class="landing-download">
        <DownloadButton :downloadUrl="response.downloadUrl" />
      </div>
      <div class="landing-subtitle">
        {{ humanReadableDate(response.measurementDate) }}
      </div>
    </div>
    <div class="tab-container">
      <router-link class="tab" :to="{ name: 'FileBeta' }">Summary</router-link>
      <router-link class="tab" :to="{ name: 'FileBetaVisualizations' }"> Visualisations </router-link>
      <router-link class="tab" :to="{ name: 'FileBetaQualityReport' }"> Quality report </router-link>
    </div>
    <div class="landing-content-background">
      <router-view
        :uuid="uuid"
        :response="response"
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
import {
  getProductIcon,
  humanReadableDate,
  humanReadableSize,
  humanReadableTimestamp,
  sortVisualizations,
  notEmpty,
  formatCoordinates,
  fetchInstrumentName,
} from "../lib";
import { DevMode } from "../lib/DevMode";
import { File, ModelFile, RegularFile } from "../../../backend/src/entity/File";
import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";
import HowToCite from "../components/HowToCite.vue";
import License from "../components/License.vue";
import Visualization from "../components/Visualization.vue";
import { Site } from "../../../backend/src/entity/Site";
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
export default class FileViewBeta1 extends Vue {
  @Prop() uuid!: string;
  response: ModelFile | RegularFile | null = null;
  visualizations: VisualizationItem[] = [];
  versions: string[] = [];
  error = false;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  humanReadableSize = humanReadableSize;
  humanReadableDate = humanReadableDate;
  humanReadableTimestamp = humanReadableTimestamp;
  getIconUrl = getProductIcon;
  sortVisualizations = sortVisualizations;
  formatCoordinates = formatCoordinates;
  devMode = new DevMode();
  allVisualizations = false;
  sourceFiles: RegularFile[] = [];
  showHowToCite = false;
  showLicense = false;
  isBusy = false;
  site!: Site;
  model: Model | null = null;
  instrument = "";
  instrumentStatus: "loading" | "error" | "ready" = "loading";
  truncateHash = true;
  loadingVisualizations = true;

  summaryActive = true;
  visualisationsActive = false;
  qualityReportActive = false;

  get maxMarginRight() {
    return Math.max(...this.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginRight).filter(notEmpty));
  }
  get maxMarginLeft() {
    return Math.max(...this.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginLeft).filter(notEmpty));
  }

  getVisualizations() {
    if (!this.allVisualizations) return this.visualizations.slice(0, 1);
    return this.visualizations;
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
  get previousVersion() {
    if (this.currentVersionIndex == null) return null;
    return this.versions[this.currentVersionIndex + 1];
  }

  get nextVersion() {
    if (!this.currentVersionIndex) return null;
    return this.versions[this.currentVersionIndex - 1];
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
    await this.fetchCitations();
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

  fetchFileMetadata(payload: {}) {
    return axios
      .get(`${this.apiUrl}files/${this.uuid}`, payload)
      .then((response) => {
        this.response = response.data;
      })
      .catch(({ response }) => {
        this.error = true;
        this.response = response;
      });
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

  fetchSourceFiles(response: RegularFile | ModelFile) {
    if (!("sourceFileIds" in response) || !response.sourceFileIds) return;
    return Promise.all(response.sourceFileIds.map((uuid) => axios.get(`${this.apiUrl}files/${uuid}`))).then(
      (response) => (this.sourceFiles = response.map((res) => res.data))
    );
  }

  async fetchCitations() {
    const citationQueryOptions = { params: { showCitations: true } };
    const [sites, models] = await Promise.all([
      axios.get(`${this.apiUrl}sites/`, citationQueryOptions),
      axios.get(`${this.apiUrl}models/`, citationQueryOptions),
    ]);
    if (!this.response) return;
    this.site = sites.data.filter((site: Site) => site.id == (this.response as File).site.id)[0];
    if ((this.response as ModelFile).model) {
      this.model = models.data.filter((model: Model) => model.id == (this.response as ModelFile).model.id)[0];
    }
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
