<template>
  <section id="fileTable">
    <div class="column1">
      <div class="results">
        <h3 class="results-title">Results</h3>
        <div class="results-subtitle" v-if="!simplifiedView && listLength > 0">
          <span v-if="isBusy">Searching...</span>
          <span v-else>Found {{ listLength }} results</span>
          <ul class="listLegend">
            <li v-if="hasVolatile"><span class="rowtag volatile rounded"></span> volatile</li>
            <li v-if="hasLegacy"><span class="rowtag legacy rounded"></span> legacy</li>
            <li v-if="hasExperimental"><span class="rowtag experimental rounded"></span> experimental</li>
          </ul>
        </div>
        <div v-if="listLength === 0 && !isBusy" class="noresults results-content">
          <h2>No results</h2>
          Are we missing some data? Send an email to
          <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>.
        </div>
        <BaseTable
          v-else
          class="results-content"
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
          @row-selected="rowSelected"
        >
          <template #cell(volatile)="data">
            <span class="rowtags">
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
                v-if="data.item.experimental"
                class="rowtag experimental rounded"
                title="This is experimental product."
              >
              </span>
            </span>
          </template>
        </BaseTable>
        <BasePagination
          class="results-pagitation"
          v-if="listLength > perPage"
          v-model="currentPage"
          :total-rows="listLength"
          :per-page="perPage"
          :disabled="isBusy"
          aria-controls="fileTable"
        />
        <div class="results-download" v-if="listLength > 0 && !simplifiedView">
          <BaseButton
            type="primary"
            class="download"
            :class="{ disabled: isBusy || downloadIsBusy }"
            href=""
            @click.prevent="createCollection()"
          >
            Download all
          </BaseButton>
          <br />
          <span v-if="!downloadFailed" class="dlcount" :class="{ disabled: isBusy || downloadIsBusy }">
            {{ listLength }} files ({{ humanReadableSize(combinedFileSize(apiResponse)) }})
          </span>
          <div v-else class="dlcount errormsg">
            {{ dlFailedMessage || "Download failed!" }}
          </div>
        </div>
      </div>
    </div>
    <div :class="{ column2: true, busy: previewBusy }">
      <div v-if="previewResponse" class="file-preview-container">
        <h3 class="preview-title">
          {{ previewResponse.product.humanReadableName }} from {{ previewResponse.site.humanReadableName }}
        </h3>
        <div class="preview-subtitle">
          {{ humanReadableDate(previewResponse.measurementDate) }}
        </div>
        <div class="filePreview">
          <visualization
            :data="pendingVisualization"
            @load="changePreview"
            :link-to="{ name: 'File', params: { uuid: previewResponse.uuid } }"
            v-if="pendingVisualization"
          />
          <span v-else>Preview not available.</span>
        </div>
        <div class="download" style="width: 100%; display: flex; gap: 1rem; margin-bottom: 2rem">
          <BaseButton type="primary" :href="previewResponse.downloadUrl" style="flex-basis: 50%">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Download
          </BaseButton>
          <BaseButton
            type="secondary"
            :to="{ name: 'File', params: { uuid: previewResponse.uuid } }"
            style="flex-basis: 50%"
          >
            Details &rarr;
          </BaseButton>
        </div>
        <dl class="inffff">
          <template v-if="'instrument' in previewResponse && previewResponse.instrument !== null">
            <dt>Instrument</dt>
            <dd>{{ previewResponse.instrument.shortName }}</dd>
          </template>
          <template v-else-if="'model' in previewResponse">
            <dt>Model</dt>
            <dd>{{ previewResponse.model.humanReadableName }}</dd>
          </template>
          <template v-else>
            <dt>Product</dt>
            <dd>{{ previewResponse.product.humanReadableName }}</dd>
          </template>
          <dt>Date</dt>
          <dd>{{ previewResponse.measurementDate }}</dd>
          <dt>Size</dt>
          <dd>{{ humanReadableSize(previewResponse.size) }}</dd>
          <dt>Last modified</dt>
          <dd>{{ humanReadableTimestamp(previewResponse.updatedAt) }}</dd>
          <dt>Quality check</dt>
          <dd>
            <span v-if="typeof previewResponse.errorLevel === 'string'" class="qualitycheck">
              <img :src="getQcIcon(previewResponse.errorLevel)" alt="" />
              <span v-if="previewResponse.errorLevel !== 'pass'">
                {{ getQcText(previewResponse.errorLevel) }}
                <router-link :to="getQcLink(previewResponse.uuid)">see report.</router-link>
              </span>
              <span v-else>Pass</span>
            </span>
            <span v-else class="notAvailable"> </span>
          </dd>
        </dl>
      </div>
      <div v-else>Click a search result to show a preview.</div>
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
  humanReadableDate,
} from "@/lib";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import BaseTable from "./BaseTable.vue";
import BasePagination from "./BasePagination.vue";
import BaseButton from "./BaseButton.vue";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "./ImageVisualization.vue";
import type { FileResponse } from "@/views/FileView.vue";
// import styles from './DataSearchResult.vue?vue&type=style&index=0&lang=sass&module=1';
// console.log(styles);

export interface Props {
  apiResponse: SearchFileResponse[];
  isBusy?: boolean;
  simplifiedView?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isBusy: false });

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
const previewBusy = ref(false);

const apiUrl = import.meta.env.VITE_BACKEND_URL;

const listLength = computed(() => props.apiResponse.length);

const hasVolatile = computed(() => props.apiResponse.some((item) => item.volatile));
const hasLegacy = computed(() => props.apiResponse.some((item) => item.legacy));
const hasExperimental = computed(() => props.apiResponse.some((item) => item.experimental));

function clearPreview() {
  currentVisualization.value = null;
  pendingVisualization.value = null;
}

function changePreview() {
  currentVisualization.value = pendingVisualization.value;
  previewResponse.value = pendingPreviewResponse.value;
  previewBusy.value = false;
}

function loadPreview(record: FileResponse) {
  previewBusy.value = true;
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
  // NOTE: Keep the breakpoint in sync with SASS below.
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
    .then(({ data: uuid }) => router.push({ name: "Collection", params: { uuid } }))
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
  perPage.value = Math.max(Math.floor(document.documentElement.clientHeight / 70), 10);
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
  },
);

onMounted(() => {
  window.addEventListener("resize", adjustPerPageAccordingToWindowHeight);
  adjustPerPageAccordingToWindowHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", adjustPerPageAccordingToWindowHeight);
});
</script>

<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/landing.sass"

:export
  helo: 1

#fileTable
  display: flex
  width: 100%
  text-align: left

  #tableContent
    margin-top: 10px

  :deep(.icon)
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

.preview-title, .results-title
  font-size: 1.2rem
  margin-bottom: .25rem

.preview-subtitle, .results-subtitle
  color: gray

.noresults
  text-align: center
  margin-top: 3em

.column1
  flex-basis: 55%
  padding-top: 2rem

.results
  display: grid
  grid-template-columns: 1fr 1fr

.results-title
  grid-row: 1
  grid-column: 1 / 3

.results-subtitle
  grid-row: 2
  grid-column: 1 / 3
  color: gray
  font-size: 85%

.results-content
  grid-row: 3
  grid-column: 1 / 3
  margin: 1rem 0 2rem

.results-pagination
  grid-row: 4
  grid-column: 1

.results-download
  grid-row: 4
  grid-column: 2

.column2
  flex-basis: 45%
  border-left: 1px solid #ddd
  padding: 2rem
  padding-right: 0
  margin-left: 2rem

  .infoBox
    margin: 0

  #file
    width: 100%

  &.busy
    opacity: 0.5
    pointer-events: none


// NOTE: Keep the breakpoint in sync with JavaScript above.
@media screen and (max-width: 1200px)
  .column2
    display: none
  .column1
    flex-basis: 100%

.listLegend
  list-style: none
  display: flex
  gap: .5em
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

.inffff
  display: grid
  grid-template-columns: auto 4fr
  column-gap: 2rem
  row-gap: .4rem

  dt
    font-weight: 500

.filePreview
  margin-top: 1rem
  aspect-ratio: 5 / 2
  display: flex
  align-items: center
  justify-content: center

.download
  margin-top: 0rem

.qualitycheck
  display: flex
  align-items: center

  img
    height: 1.15em
    margin-right: 5px
</style>
