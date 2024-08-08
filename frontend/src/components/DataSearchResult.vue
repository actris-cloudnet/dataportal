<template>
  <section id="fileTable">
    <div class="column1">
      <div class="results" v-if="isBusy && !apiResponse">
        <h3 class="results-title">Results</h3>
        <div class="results-subtitle">Searching...</div>
      </div>
      <div class="results" v-if="error">
        <h3 class="results-title">Results</h3>
        <p style="color: red">Search failed: {{ error }}</p>
      </div>
      <div class="results" v-else-if="apiResponse">
        <h3 class="results-title">Results</h3>
        <div class="results-subtitle" v-if="!simplifiedView && apiResponse.pagination.totalItems > 0">
          <span v-if="isBusy">Searching...</span>
          <span v-else>
            Found {{ apiResponse.pagination.totalItems }}
            {{ apiResponse.pagination.totalItems === 1 ? "result" : "results" }}
          </span>
          <ul class="legend">
            <li v-if="hasVolatile"><span class="rowtag volatile rounded"></span> volatile</li>
            <li v-if="hasLegacy"><span class="rowtag legacy rounded"></span> legacy</li>
            <li v-if="hasExperimental"><span class="rowtag experimental rounded"></span> experimental</li>
          </ul>
        </div>
        <div v-if="apiResponse.pagination.totalItems === 0 && !isBusy" class="noresults results-content">
          <h2>No results</h2>
          Are we missing some data? Send an email to
          <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a>.
        </div>
        <BaseTable
          v-else
          class="results-content"
          id="tableContent"
          :items="apiResponse.results"
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
          :busy="isBusy"
          :link="(file) => ({ name: 'File', params: { uuid: file.uuid } })"
          @row-selected="rowSelected"
          :selectable="selectable"
        >
          <template #cell(title)="data">
            {{ data.item.product.humanReadableName }} from {{ data.item.site.humanReadableName }}
          </template>
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
                v-if="data.item.product.experimental"
                class="rowtag experimental rounded"
                title="This is experimental product."
              >
              </span>
            </span>
          </template>
        </BaseTable>
        <BasePagination
          class="results-pagination"
          v-if="apiResponse.pagination.totalPages > 1"
          v-model="currentPage"
          :totalPages="apiResponse.pagination.totalPages"
          :disabled="isBusy"
          aria-controls="fileTable"
        />
        <div class="results-download" v-if="apiResponse.pagination.totalItems > 0 && !simplifiedView">
          <BaseButton
            type="primary"
            class="download"
            :disabled="isBusy || downloadIsBusy || apiResponse.pagination.totalItems > 10_000"
            @click="createCollection()"
          >
            Download all
          </BaseButton>
          <br />
          <span v-if="!downloadFailed" class="download-size" :class="{ disabled: isBusy || downloadIsBusy }">
            {{ apiResponse.pagination.totalItems }}
            {{ apiResponse.pagination.totalItems === 1 ? "file" : "files" }}
            ({{ humanReadableSize(apiResponse.pagination.totalBytes) }})
          </span>
          <div v-else class="download-size errormsg">
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
        <div class="preview-visualization">
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
          <template v-if="'instrumentInfo' in previewResponse && previewResponse.instrumentInfo">
            <dt>Instrument</dt>
            <dd>
              <router-link :to="{ name: 'Instrument', params: { uuid: previewResponse.instrumentInfo.uuid } }">
                {{ previewResponse.instrumentInfo.name }}
              </router-link>
            </dd>
          </template>
          <template v-else-if="'model' in previewResponse">
            <dt>Model</dt>
            <dd>{{ previewResponse.model.humanReadableName }}</dd>
          </template>
          <template v-else>
            <dt>Product</dt>
            <dd>
              {{ previewResponse.product.humanReadableName }}
            </dd>
          </template>
          <dt>Location</dt>
          <dd>
            <router-link :to="{ name: 'Site', params: { siteId: previewResponse.site.id } }">
              {{ previewResponse.site.humanReadableName
              }}<template v-if="previewResponse.site.country">, {{ previewResponse.site.country }}</template>
            </router-link>
          </dd>
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
import { watch, ref, computed } from "vue";
import {
  getProductIcon,
  humanReadableSize,
  humanReadableTimestamp,
  getQcIcon,
  getQcText,
  getQcLink,
  humanReadableDate,
  backendUrl,
} from "@/lib";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import BaseTable from "./BaseTable.vue";
import BasePagination from "./BasePagination.vue";
import BaseButton from "./BaseButton.vue";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import Visualization from "./ImageVisualization.vue";
import type { FileResponse } from "@/views/FileView.vue";
import { useInnerSize } from "@/lib/useInnerSize";
import type { SearchFile } from "@shared/entity/SearchFile";

export interface Props {
  simplifiedView?: boolean;
  sites?: string[];
  dateFrom?: string;
  dateTo?: string;
  products?: string[];
  instruments?: string[];
  instrumentPids?: string[];
  collection?: string;
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
const previewBusy = ref(false);
let previewController: AbortController | null = null;
let visualizationController: AbortController | null = null;

const hasVolatile = computed(() => apiResponse.value?.results.some((item) => item.volatile));
const hasLegacy = computed(() => apiResponse.value?.results.some((item) => item.legacy));
const hasExperimental = computed(() => apiResponse.value?.results.some((item) => item.product.experimental));

const { innerWidth } = useInnerSize();
// NOTE: Keep the breakpoint in sync with SASS below.
const selectable = computed(() => innerWidth.value > 1200);

function clearPreview() {
  currentVisualization.value = null;
  pendingVisualization.value = null;
}

function changePreview() {
  currentVisualization.value = pendingVisualization.value;
  previewResponse.value = pendingPreviewResponse.value;
  previewBusy.value = false;
}

let requestController: AbortController | null = null;

const isBusy = ref(true);
const error = ref(null);
const apiResponse = ref<SearchFileResponse | null>(null);

const payload = computed(() => ({
  site: props.sites,
  dateFrom: props.dateFrom,
  dateTo: props.dateTo,
  product: props.products,
  instrument: props.instruments,
  instrumentPid: props.instrumentPids,
  collection: props.collection,
  showLegacy: true,
  privateFrontendOrder: true,
}));

async function fetchData() {
  if (requestController) {
    requestController.abort();
  }
  requestController = new AbortController();
  isBusy.value = true;

  try {
    const res = await axios.get(`${backendUrl}search`, {
      params: { ...payload.value, page: currentPage.value },
      signal: requestController!.signal,
    });
    apiResponse.value = res.data;
    isBusy.value = false;
  } catch (err: any) {
    if (axios.isCancel(err)) return;
    console.error(err);
    error.value = (err.response && err.response.statusText) || "unknown error";
    isBusy.value = false;
  }
}

watch(
  () => [
    props.dateFrom,
    props.dateTo,
    props.sites,
    props.instruments,
    props.instrumentPids,
    props.products,
    props.collection,
  ],
  () => {
    currentPage.value = 1;
  },
);

watch(
  () => [
    props.dateFrom,
    props.dateTo,
    props.sites,
    props.instruments,
    props.instrumentPids,
    props.products,
    props.collection,
    currentPage.value,
  ],
  async (newValue, oldValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    await fetchData();
  },
  { immediate: true },
);

async function loadPreview(file: SearchFile) {
  try {
    if (previewController) previewController.abort();
    previewController = new AbortController();
    const res = await axios.get(`${backendUrl}files/${file.uuid}`, { signal: previewController.signal });
    pendingPreviewResponse.value = res.data;
    if (!previewResponse.value) {
      previewResponse.value = pendingPreviewResponse.value;
    }
  } catch (error) {
    if (axios.isCancel(error)) return;
    console.error(`Failed to load preview: ${error}`);
  }
}

async function loadVisualization(file: SearchFile) {
  try {
    if (visualizationController) visualizationController.abort();
    visualizationController = new AbortController();
    previewBusy.value = true;
    const res = await axios.get(`${backendUrl}visualizations/${file.uuid}`, { signal: visualizationController.signal });
    if (res.data.visualizations.length === 0) {
      clearPreview();
      changePreview();
      return;
    }
    pendingVisualization.value = res.data.visualizations[0];
    // Browser will start loading the visualization and call `changePreview`
    // once it's fully loaded.
  } catch (error) {
    if (axios.isCancel(error)) return;
    console.error(`Failed to load preview: ${error}`);
  }
}

function rowSelected(item: SearchFile) {
  loadPreview(item);
  loadVisualization(item);
}

async function createCollection() {
  try {
    downloadIsBusy.value = true;
    const files = await axios.get<SearchFile[]>(`${backendUrl}search`, { params: payload.value });
    const collectionUuid = await axios.post<string>(`${backendUrl}collection`, {
      files: files.data.map((file) => file.uuid),
    });
    router.push({ name: "Collection", params: { uuid: collectionUuid.data } });
  } catch (err) {
    downloadFailed.value = true;
    console.error(err);
  } finally {
    downloadIsBusy.value = false;
  }
}

function iconCellStyle(item: any) {
  return {
    backgroundImage: `url("${getProductIcon(item.product)}")`,
    width: "40px",
  };
}
</script>

<style scoped lang="scss">
#fileTable {
  display: flex;
  width: 100%;
  text-align: left;

  :deep(.icon) {
    background-repeat: no-repeat !important;
    background-position: center !important;
    background-size: 20px !important;
    font-size: 0;
  }

  .download-size {
    color: gray;
    font-size: 85%;
    text-align: center;
    display: block;
    float: right;
  }
}

.preview-title,
.results-title {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.preview-subtitle,
.results-subtitle {
  color: gray;
}

.noresults {
  text-align: center;
  margin-top: 3em;
}

.column1 {
  flex-basis: 55%;
  padding-top: 2rem;
}

.results {
  display: grid;
  grid-template-columns: auto auto;
}

.results-title {
  grid-row: 1;
  grid-column: 1 / 3;
}

.results-subtitle {
  grid-row: 2;
  grid-column: 1 / 3;
  font-size: 85%;
}

.results-content {
  grid-row: 3;
  grid-column: 1 / 3;
  margin: 1rem 0 2rem;
}

.results-pagination {
  grid-row: 4;
  grid-column: 1;
}

.results-download {
  grid-row: 4;
  grid-column: 2;
  justify-self: end;
}

.column2 {
  flex-basis: 45%;
  border-left: 1px solid #ddd;
  padding: 2rem;
  padding-right: 0;
  margin-left: 2rem;

  &.busy {
    opacity: 0.5;
    pointer-events: none;
  }
}

// NOTE: Keep the breakpoint in sync with JavaScript above.
@media screen and (max-width: 1200px) {
  .column2 {
    display: none;
  }

  .column1 {
    flex-basis: 100%;
  }
}

.legend {
  list-style: none;
  display: flex;
  gap: 0.5rem;
  float: right;
  text-align: right;
}

.inffff {
  display: grid;
  grid-template-columns: auto 4fr;
  column-gap: 2rem;
  row-gap: 0.4rem;

  dt {
    font-weight: 500;
  }
}

.preview-visualization {
  margin-top: 1rem;
  aspect-ratio: 5 / 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qualitycheck {
  display: flex;
  align-items: center;

  img {
    height: 1.15em;
    margin-right: 5px;
  }
}
</style>
