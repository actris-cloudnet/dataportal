<style lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
@import "@/sass/landing.sass"

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
          <span class="rowtag volatile rounded"></span> volatile
          <span class="rowtag legacy rounded"></span> legacy
        </span>
      </span>
      <div v-if="listLength === 0 && !isBusy" class="noresults">
        <h2>No results</h2>
        Are we missing some data? Send an email to
        <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>.
      </div>
      <BaseTable
        v-else
        id="tableContent"
        :items="apiResponse"
        keyField="uuid"
        :fields="[
          {
            key: 'productId',
            label: '',
            tdClass: 'icon',
            tdStyle: iconCellStyle,
          },
          { key: 'title', label: 'Data object' },
          { key: 'volatile', label: '' },
          { key: 'measurementDate', label: 'Date' },
        ]"
        :current-page="currentPage"
        :per-page="perPage"
        :busy="isBusy"
        :show-empty="true"
        selectable
        select-mode="single"
        @row-selected="rowSelected"
      >
        <template #cell(volatile)="data">
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
          <span
            ><!-- Dummy element needed when there are no other elements. --></span
          >
        </template>
      </BaseTable>
      <BasePagination
        id="pagi"
        v-if="listLength > perPage"
        v-model="currentPage"
        :total-rows="listLength"
        :per-page="perPage"
        :disabled="isBusy"
        aria-controls="fileTable"
      />
      <div class="downloadinfo" v-if="listLength > 0 && !simplifiedView">
        <a
          class="download"
          :class="{ disabled: isBusy || downloadIsBusy }"
          href=""
          @click.prevent="createCollection()"
        >
          Download all </a
        ><br />
        <span
          v-if="!downloadFailed"
          class="dlcount"
          :class="{ disabled: isBusy || downloadIsBusy }"
        >
          {{ listLength }} files ({{
            humanReadableSize(combinedFileSize(apiResponse))
          }})
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
        <router-link
          v-if="previewResponse"
          :to="`/file/${previewResponse.uuid}`"
          class="listLegend linkToDoPage"
        >
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
                <span
                  v-if="typeof previewResponse.errorLevel === 'string'"
                  class="qualitycheck"
                >
                  <img :src="getQcIcon(previewResponse.errorLevel)" alt="" />
                  <span v-if="previewResponse.errorLevel !== 'pass'">
                    {{ getQcText(previewResponse.errorLevel) }}
                    <router-link :to="getQcLink(previewResponse.uuid)"
                      >see report.</router-link
                    >
                  </span>
                  <span v-else> Pass</span>
                </span>
                <span v-else class="notAvailable"> </span>
              </dd>
            </dl>
          </section>
        </section>
        <section id="preview">
          <header>Visualization</header>
          <section class="details">
            <div v-if="pendingVisualization">
              <div class="variable">
                <h4 v-if="currentVisualization">
                  {{ currentVisualization.productVariable.humanReadableName }}
                  <a
                    :href="currentVisualization.productVariable.actrisVocabUri"
                    v-if="currentVisualization.productVariable.actrisVocabUri"
                    title="ACTRIS variable"
                  >
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
                </h4>
                <router-link :to="`/file/${previewResponse.uuid}`">
                  <visualization
                    :data="pendingVisualization"
                    @load="changePreview"
                  />
                </router-link>
              </div>
            </div>
            <span v-else>Preview not available.</span>
          </section>
        </section>
        <a class="download" :href="previewResponse.downloadUrl">
          Download file
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </a>
      </main>
      <div v-else class="listTitle previewSubTitle">
        Click a search result to show a preview.
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import axios from "axios";
import { useRouter } from "vue-router";
import { watch, onMounted, onBeforeUnmount, ref, computed } from "vue";
import {
  combinedFileSize,
  getProductIcon,
  humanReadableSize,
  humanReadableTimestamp,
  getQcIcon,
  getQcText,
  getQcLink,
} from "@/lib";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import BaseTable from "./BaseTable.vue";
import BasePagination from "./BasePagination.vue";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "./ImageVisualization.vue";
import type { FileResponse } from "@/views/FileView.vue";

export interface Props {
  apiResponse: SearchFileResponse[];
  isBusy: boolean;
  simplifiedView?: boolean;
}

const props = defineProps<Props>();

const router = useRouter();

const downloadIsBusy = ref(false);
const downloadFailed = ref(false);
const dlFailedMessage = ref("");
const previewResponse = ref<FileResponse | null>(null);
const pendingPreviewResponse = ref<FileResponse | null>(null);
const currentVisualization = ref<VisualizationItem | null>(null);
const pendingVisualization = ref<VisualizationItem | null>(null);
const currentPage = ref(1);
const perPage = ref(15);

const apiUrl = import.meta.env.VITE_BACKEND_URL;

const listLength = computed(() => props.apiResponse.length);

function clearPreview() {
  currentVisualization.value = null;
  pendingVisualization.value = null;
}

function changePreview() {
  currentVisualization.value = pendingVisualization.value;
  previewResponse.value = pendingPreviewResponse.value;
}

function loadPreview(record: FileResponse) {
  axios
    .get(`${apiUrl}visualizations/${record.uuid}`)
    .then(({ data }) => {
      if (data.visualizations.length === 0) {
        clearPreview();
        changePreview();
        return;
      }
      pendingVisualization.value = data.visualizations[0];
    })
    .catch((error) => console.error(`Failed to load preview: ${error}`));
}

function rowSelected(item: FileResponse) {
  // NOTE: Keep the breakpoint in sync with SASS above.
  if (window.innerWidth <= 1200) {
    router.push(`/file/${item.uuid}`).catch(() => {
      /* */
    });
  } else {
    axios
      .get(`${apiUrl}files/${item.uuid}`)
      .then(({ data }) => {
        pendingPreviewResponse.value = data;
        if (!previewResponse.value) {
          previewResponse.value = pendingPreviewResponse.value;
        }
      })
      .catch((error) => console.error(`Failed to load preview: ${error}`));
    loadPreview(item);
  }
}

function createCollection() {
  if (listLength.value > 10000) {
    downloadFailed.value = true;
    dlFailedMessage.value = "You may only download a maximum of 10 000 files!";
    return;
  }
  downloadIsBusy.value = true;
  axios
    .post(`${apiUrl}collection`, {
      files: props.apiResponse.map((file) => file.uuid),
    })
    .then(({ data: uuid }) =>
      router.push({ name: "Collection", params: { uuid } })
    )
    .catch((err) => {
      downloadFailed.value = true;
      // eslint-disable-next-line no-console
      console.error(err);
    })
    .finally(() => (downloadIsBusy.value = false));
}

function iconCellStyle(item: any) {
  return {
    backgroundImage: `url(${getProductIcon(item.productId)})`,
    width: "40px",
  };
}

function adjustPerPageAccordingToWindowHeight() {
  perPage.value = Math.max(
    Math.floor(document.documentElement.clientHeight / 70),
    10
  );
}

watch(
  () => props.isBusy,
  () => {
    // Reset page on filter change
    if (!props.isBusy) {
      currentPage.value = 1;
    }
    downloadFailed.value = false;
    previewResponse.value = null;
  }
);

onMounted(() => {
  window.addEventListener("resize", adjustPerPageAccordingToWindowHeight);
  adjustPerPageAccordingToWindowHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", adjustPerPageAccordingToWindowHeight);
});
</script>
