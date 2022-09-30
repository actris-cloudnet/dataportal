<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

section#fileTable
  width: 100%
  text-align: left
  margin-top: -15px

  #tableContent
    margin-top: 10px

  .listTitle
    color: gray
    font-size: 85%
    margin-bottom: 5px
    display: block

  #pagi
    margin-top: 30px
    float: left
    .page-item.active .page-link
      background-color: $steel-warrior
      border-color: $steel-warrior
    .page-link:hover
      background-color: $blue-dust
    .page-link
      color: $blue-sapphire

  .table-striped
    th:focus
      outline: thin dotted
    th:nth-child(1)
      width: 50px
      text-align: center
    th:nth-child(2)
      width: 300px
    th:nth-child(3)
      width: 100px
    th:nth-child(4)
      width: 110px
    td
      padding: 9px
    tbody tr
      border-top: 1px solid transparent
      &:last-child
        border-bottom: 1px solid transparent
    tbody tr:nth-child(odd)
      background-color: $blue-dust
    td:nth-child(3)
      text-align: center
  .table-striped[aria-busy="false"] tbody
    tr:hover, tr:focus, tr.b-table-row-selected
      background-color: #e4eff7
    tr.b-table-row-selected
      border-top-color: darkgray
      & + tr
        border-top-color: darkgray
      &:last-child
        border-bottom: 1px solid darkgray
      td
        background: none
    tr:hover td
      cursor: pointer
    tr
      outline: none

  .text-center.my-2
    display: none

  .icon
    background-repeat: no-repeat !important
    background-position: center !important
    background-size: 20px !important
    font-size: 0

  .downloadinfo
    float: right
    margin-top: 30px

  .downloadinfo > .download
    float: right

  .dlcount
    color: gray
    font-size: 85%
    text-align: center
    display: block
    float: right

  .download:focus
    outline: thin dotted black

.previewTitle, .previewSubTitle
  margin-left: 15px

.linkToDoPage
  margin-right: 15px

.noresults
  text-align: center
  margin-top: 3em

.column1
  float: left
  width: 50%

.column2
  width: 45%
  margin-left: 1em
  float: right

  .infoBox
    margin: 0

  #file
    width: 100%


// NOTE: Keep the breakpoint in sync with JavaScript below.
@media screen and (max-width: 1200px)
  .column2
    display: none
  .column1
    width: 100%

.previewdescription
  font-size: 0.8em

.listLegend
  display: inline-block
  float: right
  text-align: right

.inlineblock
  display: inline-block

.center
  text-align: center

#preview
  width: 100%

.visualization
  width: 100%
  height: auto
</style>

<template>
  <section id="fileTable">
    <div class="column1">
      <h3>Results</h3>
      <span class="listTitle" v-if="!simplifiedView && listLength > 0">
        <span v-if="isBusy">Searching...</span>
        <span v-else>Found {{ listLength }} results</span>
        <span class="listLegend">
          <span class="rowtag volatile rounded"></span> volatile <span class="rowtag legacy rounded"></span> legacy
        </span>
      </span>
      <div v-if="listLength === 0 && !isBusy" class="noresults">
        <h2>No results</h2>
        Are we missing some data? Send an email to
        <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>.
      </div>
      <b-table
        v-else
        id="tableContent"
        borderless
        small
        striped
        hover
        sort-icon-left
        :items="apiResponse"
        :fields="[
          { key: 'productId', label: '', tdClass: 'icon', tdAttr: setIcon },
          { key: 'title', label: 'Data object', sortable: true },
          { key: 'volatile', label: '' },
          { key: 'measurementDate', label: 'Date', sortable: true },
        ]"
        :current-page="currentPage"
        :per-page="perPage"
        :busy="isBusy"
        :show-empty="true"
        selectable
        select-mode="single"
        @row-selected="rowSelected"
      >
        <template v-slot:cell(volatile)="data">
          <span
            v-if="data.item.volatile"
            class="rowtag volatile rounded"
            title="The data for this day may be incomplete. This file is updating in real time."
          >
          </span>
          <span
            v-if="data.item.legacy"
            class="rowtag legacy rounded"
            title="This is legacy data. Quality of the data is not assured."
          >
          </span>
        </template>
      </b-table>
      <b-pagination
        id="pagi"
        v-if="listLength > perPage"
        v-model="currentPage"
        :total-rows="listLength"
        :per-page="perPage"
        :disabled="isBusy"
        aria-controls="fileTable"
        align="center"
      ></b-pagination>
      <div class="downloadinfo" v-if="listLength > 0 && !simplifiedView">
        <a
          class="download"
          v-bind:class="{ disabled: isBusy || downloadIsBusy }"
          href=""
          @click.prevent="createCollection()"
        >
          Download all </a
        ><br />
        <span v-if="!downloadFailed" class="dlcount" v-bind:class="{ disabled: isBusy || downloadIsBusy }">
          {{ listLength }} files ({{ humanReadableSize(combinedFileSize(apiResponse)) }})
        </span>
        <div v-else class="dlcount errormsg">
          {{ dlFailedMessage || "Download failed!" }}
        </div>
        <br />
      </div>
    </div>
    <div class="column2">
      <div>
        <h3 class="inlineblock previewTitle">Preview</h3>
        <router-link v-if="previewResponse" :to="`/file/${previewResponse.uuid}`" class="listLegend linkToDoPage">
          Show file &rarr;
        </router-link>
      </div>
      <main class="infoBox" v-if="previewResponse">
        <section id="file">
          <header>File information</header>
          <section class="details">
            <dl>
              <dt>PID</dt>
              <dd v-if="previewResponse.pid.length > 2">
                <a :href="previewResponse.pid"> {{ previewResponse.pid }} </a>
              </dd>
              <dd v-else class="notAvailable"></dd>
              <dt>Filename</dt>
              <dd>{{ previewResponse.filename }}</dd>
              <dt>Size</dt>
              <dd>{{ humanReadableSize(previewResponse.size) }}</dd>
              <dt>Last modified</dt>
              <dd>{{ humanReadableTimestamp(previewResponse.updatedAt) }}</dd>
              <dt>Quality check</dt>
              <dd>
                <span v-if="typeof previewResponse.errorLevel === 'string'" class="qualitycheck">
                  <router-link :to="`/quality/${previewResponse.uuid}`">
                    <img :src="getQcIcon(previewResponse.errorLevel)" alt="" />
                  </router-link>
                  <span v-if="previewResponse.errorLevel !== 'pass'">
                    Some issues, <router-link :to="`/quality/${previewResponse.uuid}`">see report. </router-link></span
                  >
                  <span v-else> Pass </span>
                </span>
                <span v-else class="notAvailable"> </span>
              </dd>
            </dl>
          </section>
        </section>
        <section id="preview">
          <header>Visualization</header>
          <section class="details">
            <div v-if="previewImgUrl">
              <div class="variable">
                <h4>{{ previewTitle }}</h4>
                <router-link :to="`/file/${previewResponse.uuid}`">
                  <img :src="previewImgUrl" class="visualization" @load="changePreview" />
                </router-link>
              </div>
            </div>
            <span v-else>Preview not available.</span>
          </section>
        </section>
        <a class="download" :href="previewResponse.downloadUrl">
          Download file
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </a>
      </main>
      <div v-else class="listTitle previewSubTitle">Click a search result to show a preview.</div>
    </div>
  </section>
</template>

<script lang="ts">
import axios from "axios";
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "../../../backend/src/entity/File";
import Vue from "vue";
import {
  combinedFileSize,
  getProductIcon,
  humanReadableSize,
  humanReadableTimestamp,
  sortVisualizations,
  getQcIcon,
} from "../lib";
import { SearchFileResponse } from "../../../backend/src/entity/SearchFileResponse";
import { BTable } from "bootstrap-vue/esm/components/table";
import { BPagination } from "bootstrap-vue/esm/components/pagination";

Vue.component("b-table", BTable);
Vue.component("b-pagination", BPagination);

@Component
export default class DataSearchResult extends Vue {
  @Prop() apiResponse!: SearchFileResponse[];
  @Prop() isBusy!: boolean;
  @Prop() downloadUri!: string;
  @Prop() simplifiedView?: boolean;
  downloadIsBusy = false;
  downloadFailed = false;
  dlFailedMessage = "";
  apiUrl = process.env.VUE_APP_BACKENDURL;
  previewResponse: File | null = null;
  pendingPreviewResponse: File | null = null;

  currentPage = 1;
  perPage = 15;

  previewImgUrl = "";
  previewTitle = "";
  pendingPreviewTitle = "";

  humanReadableSize = humanReadableSize;
  humanReadableTimestamp = humanReadableTimestamp;
  combinedFileSize = combinedFileSize;
  getQcIcon = getQcIcon;

  mounted() {
    window.addEventListener("resize", this.adjustPerPageAccordingToWindowHeight);
    this.adjustPerPageAccordingToWindowHeight();
  }

  beforeDestroy() {
    window.removeEventListener("resize", this.adjustPerPageAccordingToWindowHeight);
  }

  get listLength() {
    return this.apiResponse.length;
  }

  rowSelected(records: File[]) {
    if (records.length === 0) {
      this.clearPreview();
      this.previewTitle = "";
      this.previewResponse = null;
      return;
    }
    const record = records[0];
    // NOTE: Keep the breakpoint in sync with SASS above.
    if (window.innerWidth <= 1200) {
      this.$router.push(`/file/${record.uuid}`).catch(() => {
        /* */
      });
    } else {
      axios
        .get(`${this.apiUrl}files/${record.uuid}`)
        .then(({ data }) => {
          this.pendingPreviewResponse = data;
          if (!this.previewResponse) {
            this.previewResponse = this.pendingPreviewResponse;
          }
        })
        .catch((error) => console.error(`Failed to load preview: ${error}`));
      this.loadPreview(record);
    }
  }

  loadPreview(record: File) {
    axios
      .get(`${this.apiUrl}visualizations/${record.uuid}`)
      .then(({ data }) => {
        if (data.visualizations.length === 0) {
          this.clearPreview();
          this.changePreview();
          return;
        }
        const viz = sortVisualizations(data.visualizations)[0];
        this.previewImgUrl = `${this.apiUrl}download/image/${viz.s3key}`;
        this.pendingPreviewTitle = viz.productVariable.humanReadableName;
      })
      .catch((error) => console.error(`Failed to load preview: ${error}`));
  }

  clearPreview() {
    this.previewImgUrl = "";
  }

  changePreview() {
    this.previewTitle = this.pendingPreviewTitle;
    this.previewResponse = this.pendingPreviewResponse;
  }

  createCollection() {
    if (this.listLength > 10000) {
      this.downloadFailed = true;
      this.dlFailedMessage = "You may only download a maximum of 10 000 files!";
    }
    this.downloadIsBusy = true;
    axios
      .post(`${this.apiUrl}collection`, { files: this.apiResponse.map((file) => file.uuid) })
      .then(({ data }) => this.$router.push({ path: `/collection/${data}` }))
      .catch((err) => {
        this.downloadFailed = true;
        // eslint-disable-next-line no-console
        console.error(err);
      })
      .finally(() => (this.downloadIsBusy = false));
  }

  setIcon(product: string) {
    if (product) return { style: `background-image: url(${getProductIcon(product)})` };
  }

  adjustPerPageAccordingToWindowHeight() {
    this.perPage = Math.max(Math.floor(document.documentElement.clientHeight / 70), 10);
  }

  @Watch("isBusy")
  onBusyChanged() {
    // Reset page on filter change
    if (!this.isBusy) {
      this.currentPage = 1;
    }
    this.downloadFailed = false;
    this.previewResponse = null;
  }
}
</script>
