<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/visualizations.sass"
@import "../sass/landing.sass"

main#filelanding

  >header
    display: flex
    justify-content: space-between
    align-items: center
    flex-wrap: wrap
    position: relative

  div.actions
    margin-top: 5px
    margin-bottom: 5px

  .volatilenote
    border-color: #cad7ff
    background: #eef2ff

  .versionnote
    border-color: #fff2ca
    background: #fffdee

  .legacynote
    border-color: #d7d7d7
    background: #f7f7f7

  section#preview.wide
    flex-basis: 100%

  .history
    flex-grow: 1
    flex-direction: column
    display: flex
    justify-content: space-between
    align-items: flex-start

  .monospace
    white-space: pre-wrap
    font-family: monospace
    width: 100%
    display: block

  #preview
    flex-basis: 600px
    img
      width: 100%
      height: auto

  a.viewAllPlots
    cursor: pointer
  a.viewAllPlots:hover
    color: #0056b3
    text-decoration: underline

  .hoverbox
    position: absolute
    right: -1em
    margin-right: 1em
    margin-top: 1em
    margin-bottom: 1em
    z-index: 100
    background: white
    max-width: 53em
    padding: 1em
    border: 1px solid $border-color
    border-radius: 3px
    box-shadow: 3px 3px 3px rgba(0,0,0,0.1)
    .closeX
      font-style: normal

.capitalize
  text-transform: capitalize

.na
  color: grey

.loading
  color: grey

.error
  color: red

.download:focus, .secondaryButton:focus
  outline: thin dotted black

.secondaryButton
  margin-right: 1em

.qualitycheck
  img
    height: 1.2em
    margin-top: -4px
</style>

<template>
  <main id="filelanding" v-if="!error && response">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()" />
    <header>
      <div class="summary">
        <h2>Cloudnet data object</h2>
        <span>
          {{ response.product.humanReadableName }} data from {{ response.site.humanReadableName }} on
          {{ humanReadableDate(response.measurementDate) }}.
        </span>
      </div>
      <div class="actions">
        <a
          class="secondaryButton"
          id="showCiting"
          v-bind:class="{ active: showHowToCite, disabled: response.volatile }"
          @click="response.volatile ? null : (showHowToCite = !showHowToCite) && (showLicense = false)"
          :title="response.volatile ? 'Citing information is not available for volatile files' : ''"
          >How to cite
        </a>
        <div class="hoverbox" v-if="showHowToCite">
          <span class="closeX" id="hideCiting" @click="showHowToCite = false"> &#10005; </span>
          <how-to-cite
            :pid="response.pid"
            :products="[response.product]"
            :sites="[site]"
            :models="model ? [model] : []"
            :nonModelSiteIds="response.model ? [] : [response.site.id]"
            :startDate="response.measurementDate"
          ></how-to-cite>
        </div>
        <a
          class="secondaryButton"
          id="showLicense"
          v-bind:class="{ active: showLicense }"
          @click="(showLicense = !showLicense) && (showHowToCite = false)"
          >License
        </a>
        <div class="hoverbox" v-if="showLicense">
          <span class="closeX" id="hideLicense" @click="showLicense = false"> &#10005; </span>
          <license></license>
        </div>
        <a class="download" :href="response.downloadUrl">
          Download file
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </a>
      </div>
    </header>
    <div v-if="response.volatile" class="note volatilenote">
      This is a volatile file. The data in this file may be incomplete and update in real time.
    </div>
    <div v-if="response.legacy" class="note legacynote">This is legacy data. Quality of the data is not assured.</div>
    <div v-if="!isBusy && newestVersion" class="note versionnote">
      A <router-link id="newestVersion" :to="`/file/${newestVersion}`">newer version</router-link> of this file is
      available.
    </div>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>PID</dt>
            <dd v-if="response.pid.length > 2">
              <a :href="response.pid"> {{ response.pid }} </a>
            </dd>
            <dd v-else class="notAvailable"></dd>
            <dt>Filename</dt>
            <dd>{{ response.filename }}</dd>
            <dt>Format</dt>
            <dd>{{ response.format }}</dd>
            <dt>Size</dt>
            <dd>{{ response.size }} bytes ({{ humanReadableSize(response.size) }})</dd>
            <dt>Hash (SHA-256)</dt>
            <dd>
              <template v-if="truncateHash">
                {{ response.checksum.slice(0, 16) }}...
                <a href="javascript:void(0)" @click="truncateHash = false">show full</a>
              </template>
              <template v-else>
                {{ response.checksum }}
              </template>
            </dd>
            <dt>Last modified</dt>
            <dd>{{ humanReadableTimestamp(response.updatedAt) }}</dd>
            <dt>Versions</dt>
            <dd>
              <router-link
                v-if="!isBusy && previousVersion"
                id="previousVersion"
                :to="`/file/${previousVersion}`"
                replace
              >
                previous
              </router-link>
              <span v-if="!isBusy && previousVersion && nextVersion">-</span>
              <router-link v-if="!isBusy && nextVersion" id="nextVersion" :to="`/file/${nextVersion}`" replace>
                next</router-link
              >
              <span v-if="isBusy || (!previousVersion && !nextVersion)" class="notAvailable"></span>
            </dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Product information</header>
        <section class="details">
          <dl>
            <dt>Product</dt>
            <dd class="capitalize">
              <img :alt="response.product.id" :src="getIconUrl(response.product.id)" class="product" />
              {{ response.product.humanReadableName }}
            </dd>
            <dt>Level</dt>
            <dd>
              {{ response.product.level }}
              <a :href="'https://docs.cloudnet.fmi.fi/levels.html#level-' + response.product.level">
                <svg
                  class="link"
                  fill="#000000"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 30 30"
                  width="60px"
                  height="60px"
                >
                  <path
                    d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
                  />
                </svg>
              </a>
            </dd>
            <template v-if="response.instrumentPid">
              <dt>Instrument</dt>
              <dd>
                <span v-if="instrumentStatus === 'loading'" class="loading">Loading...</span>
                <a v-else-if="instrumentStatus === 'error'" :href="response.instrumentPid" class="error">
                  Failed to load information
                </a>
                <a v-else :href="response.instrumentPid">{{ instrument }}</a>
              </dd>
            </template>
            <dt>Timeliness</dt>
            <dd>{{ response.quality === "qc" ? "Regular" : "Near Real Time (NRT)" }}</dd>
            <dt>Quality check</dt>
            <dd>
              <span v-if="response.qualityScore === 1" class="qualitycheck">
                <router-link :to="`/quality/${response.uuid}`">
                  <img :src="require('../assets/icons/pass.png')" />
                </router-link>
                Pass.
              </span>
              <span v-else-if="typeof response.qualityScore === 'number'" class="qualitycheck">
                <router-link :to="`/quality/${response.uuid}`">
                  <img :src="require('../assets/icons/pass-fail.png')" />
                </router-link>
                Some issues, <router-link :to="`/quality/${response.uuid}`">see report.</router-link>
              </span>
              <span v-else class="notAvailable"></span>
            </dd>
            <dt v-if="response.cloudnetpyVersion || response.processingVersion">Software</dt>
            <dd v-if="response.cloudnetpyVersion || response.processingVersion">
              <span v-if="response.processingVersion">
                Cloudnet processing {{ response.processingVersion }}
                <a href="https://github.com/actris-cloudnet/cloudnet-processing/"
                  ><svg
                    class="link"
                    fill="#000000"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 30 30"
                    width="60px"
                    height="60px"
                  >
                    <path
                      d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
                    /></svg
                ></a>
                <br />
              </span>
              <span v-if="response.cloudnetpyVersion">
                CloudnetPy {{ response.cloudnetpyVersion }}
                <a href="https://github.com/actris-cloudnet/cloudnetpy/"
                  ><svg
                    class="link"
                    fill="#000000"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 30 30"
                    width="60px"
                    height="60px"
                  >
                    <path
                      d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
                    /></svg
                ></a>
              </span>
            </dd>
            <dt v-if="response.model">Model</dt>
            <dd v-if="response.model">
              {{ response.model.id }}
            </dd>
            <dt>Data from</dt>
            <dd>{{ response.measurementDate }}</dd>
          </dl>
        </section>
      </section>
      <section id="measurement">
        <header>Site information</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd>
              <router-link :to="`/site/${this.response.site.id}`">
                {{ response.site.humanReadableName }}, {{ response.site.country }}
              </router-link>
            </dd>
            <dt>Coordinates</dt>
            <dd>{{ formatCoordinates(response.site.latitude, response.site.longitude) }}</dd>
            <dt>Site altitude</dt>
            <dd>{{ response.site.altitude }} m</dd>
          </dl>
        </section>
      </section>
      <section id="history">
        <header>Provenance</header>
        <section class="details history">
          <div v-if="response.sourceFileIds && response.sourceFileIds.length > 0" class="detailslist">
            <span class="notice">This file was generated using the following files:<br /></span>
            <div v-for="sourceFile in sourceFiles" :key="sourceFile.uuid" class="detailslistItem">
              <router-link :to="`/file/${sourceFile.uuid}`">
                <img :alt="sourceFile.product.id" :src="getIconUrl(sourceFile.product.id)" class="product" />
                {{ sourceFile.product.humanReadableName }} </router-link
              ><br />
            </div>
          </div>
          <div class="detailslistNotAvailable" v-else>Source file information not available.</div>
        </section>
      </section>
      <section id="preview" v-bind:class="{ wide: allVisualizations }">
        <header>Visualizations</header>
        <section class="details">
          <div v-if="visualizations.length" v-bind:class="{ sourceFile: allVisualizations }">
            <div v-for="viz in getVisualizations(visualizations)" :key="viz.productVariable.id" class="variable">
              <h4>{{ viz.productVariable.humanReadableName }}</h4>
              <a
                v-if="visualizations.length > 1 && !allVisualizations"
                class="viewAllPlots"
                @click="allVisualizations = true"
              >
                <visualization :data="viz" :maxMarginLeft="maxMarginLeft" :maxMarginRight="maxMarginRight" />
              </a>
              <visualization v-else :data="viz" :maxMarginLeft="maxMarginLeft" :maxMarginRight="maxMarginRight" />
            </div>
          </div>
          <a
            v-if="visualizations.length > 1 && !allVisualizations"
            class="notice viewAllPlots"
            @click="allVisualizations = true"
          >
            Show all plots
          </a>
          <a v-else-if="allVisualizations" class="notice viewAllPlots" @click="allVisualizations = false">
            Show one plot
          </a>
          <span v-else-if="visualizations.length === 0">Preview not available.</span>
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
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

Vue.component("how-to-cite", HowToCite);
Vue.component("license", License);
Vue.component("visualization", Visualization);

@Component
export default class FileView extends Vue {
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

  fetchVisualizations(payload: {}) {
    return axios
      .get(`${this.apiUrl}visualizations/${this.uuid}`, payload)
      .then((response) => {
        this.visualizations = sortVisualizations(response.data.visualizations);
      })
      .catch();
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
