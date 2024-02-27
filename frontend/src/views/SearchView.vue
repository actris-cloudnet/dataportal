<template>
  <main v-if="mode === 'visualizations' || mode === 'data'" id="search" :class="mainWidth">
    <BaseAlert v-if="error" type="error" style="margin-top: 1rem">
      Error: Search backend is offline, {{ error }}
    </BaseAlert>

    <div v-if="allSites && allSites.length > 0 && showAllSites" class="widemap">
      <SuperMap
        :key="mapKey"
        :sites="siteOptions"
        :selectedSiteIds="selectedSiteIds"
        :onMapMarkerClick="onMapMarkerClick"
        :center="[54.0, 14.0]"
        :zoom="2"
        showLegend
        enableBoundingBox
      />
    </div>

    <div id="searchContainer">
      <section id="sideBar">
        <div v-if="allSites && allSites.length > 0 && !showAllSites" class="smallmap">
          <SuperMap
            :key="mapKey"
            :sites="siteOptions"
            :selectedSiteIds="selectedSiteIds"
            :onMapMarkerClick="onMapMarkerClick"
            :center="[58.0, 14.0]"
            :zoom="2.5"
            enableBoundingBox
          />
        </div>

        <div class="filterbox">
          <custom-multiselect
            label="Location"
            v-model="selectedSiteIds"
            :options="siteOptions"
            id="siteSelect"
            class="nobottommargin"
            :class="{ widemapmarginleft: showAllSites }"
            :multiple="true"
            :getIcon="getMarkerIcon"
          />
          <CheckBox class="checkbox" v-model="showAllSites" label="Show all sites" />
        </div>

        <div class="filterbox">
          <span class="filterlabel">Date</span>
          <div class="quickselectors" v-if="!isVizMode">
            <button
              id="yearBtn"
              class="quickBtn"
              @click="setDateRangeForCurrentYear()"
              :class="{ activeBtn: activeBtn === 'btn1' }"
            >
              Current year
            </button>
            <button
              id="monthBtn"
              class="quickBtn"
              @click="setDateRange(fixedRanges.month)"
              :class="{ activeBtn: activeBtn === 'btn2' }"
            >
              Last 30 days
            </button>
            <button
              id="weekBtn"
              class="quickBtn"
              @click="setDateRange(fixedRanges.day)"
              :class="{ activeBtn: activeBtn === 'btn3' }"
            >
              Today
            </button>
          </div>

          <div class="date" v-if="!isVizMode && showDateRange">
            <datepicker
              name="dateFrom"
              v-model="dateFrom"
              :start="beginningOfHistory"
              :end="dateTo"
              @error="dateFromError = $event"
              :key="dateFromUpdate"
            />
            <span class="centerlabel">&#8212;</span>
            <datepicker
              name="dateTo"
              v-model="dateTo"
              :start="showDateRange ? dateFrom : beginningOfHistory"
              :end="today"
              @error="dateToError = $event"
              :key="dateToUpdate"
            />
            <div v-if="!isTrueOnBothDateFields('isValidDateString')" class="errormsg">
              Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
            </div>
            <template v-else>
              <div v-if="!isTrueOnBothDateFields('isNotInFuture')" class="errormsg">
                Provided date is in the future.
              </div>
              <div
                v-if="(dateFromError && !dateFromError.isBeforeEnd) || (dateToError && !dateToError.isAfterStart)"
                class="errormsg"
              >
                Start date must be before end date.
              </div>
            </template>
          </div>

          <div class="date" v-else>
            <datepicker
              name="dateTo"
              v-model="dateTo"
              :start="beginningOfHistory"
              :end="today"
              @error="dateToError = $event"
              :key="vizDateUpdate"
            />
            <div class="dateButtons">
              <BaseButton type="secondary" id="previousBtn" @click="setPreviousDate()" :disabled="!hasPreviousDate()">
                &larr;
              </BaseButton>
              <BaseButton
                type="secondary"
                id="nextBtn"
                @click="setNextDate()"
                :disabled="!hasNextDate()"
                style="margin-left: 0.5rem"
              >
                &rarr;
              </BaseButton>
            </div>
            <div v-if="dateToError && !dateToError.isValidDateString" class="errormsg">
              Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
            </div>
            <div v-if="dateToError && dateToError.isValidDateString && !dateToError.isNotInFuture" class="errormsg">
              Provided date is in the future.
            </div>
          </div>
          <CheckBox
            id="showDateRangeCheckbox"
            class="checkbox"
            v-model="showDateRange"
            label="Show date range"
            v-if="!isVizMode"
          />
        </div>

        <div class="filterbox">
          <custom-multiselect
            label="Product"
            v-model="selectedProductIds"
            :options="productOptions"
            id="productSelect"
            :multiple="true"
            :getIcon="getProductIcon"
          />
          <CheckBox
            id="showExpProductsCheckbox"
            class="checkbox"
            v-model="showExpProducts"
            label="Show experimental products"
          />
        </div>

        <div class="filterbox">
          <custom-multiselect
            label="Instrument"
            v-model="selectedInstrumentIds"
            :options="allInstruments"
            id="instrumentSelect"
            :multiple="true"
            :getIcon="getInstrumentIcon"
          />
        </div>

        <div class="filterbox">
          <custom-multiselect
            v-show="isVizMode"
            label="Variable"
            v-model="selectedVariableIds"
            :options="variableOptions"
            :multiple="true"
            id="variableSelect"
            :getIcon="getVariableIcon"
          />
        </div>

        <details ref="detailsSection">
          <summary>Advanced</summary>
          <div class="filterbox">
            <custom-multiselect
              label="Instrument PID"
              v-model="selectedInstrumentPids"
              :options="allInstrumentPids"
              :multiple="true"
              id="instrumentPidSelect"
              :getIcon="getPidIcon"
            />
          </div>
        </details>

        <div class="filterbox">
          <BaseButton v-if="isVizMode" @click="navigateToSearch('data')" type="secondary" style="width: 100%">
            View in data search &rarr;
          </BaseButton>
          <BaseButton v-else @click="navigateToSearch('visualizations')" type="secondary" style="width: 100%">
            View in visualization search &rarr;
          </BaseButton>
          <a :href="isVizMode ? '/search/visualizations' : '/search/data'" id="reset">Reset filter</a>
        </div>
      </section>

      <div class="results">
        <viz-search-result
          v-if="isVizMode"
          :apiResponse="apiResponse as VisualizationResponse[]"
          :isBusy="isBusy"
          :date="dateTo"
          :key="vizSearchUpdate"
          :noSelectionsMade="noSelectionsMade"
          :setWideMode="setVizWideMode"
        />
        <data-search-result
          v-else
          :apiResponse="apiResponse as SearchFileResponse[]"
          :isBusy="isBusy"
          :key="dataSearchUpdate"
        />
      </div>
    </div>
  </main>
  <ApiError v-else :response="{ status: 404, data: 'Not found' }" />
</template>

<script lang="ts">
export default {
  name: "app-search",
};
</script>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import axios, { all } from "axios";
import type { Site, SiteType } from "@shared/entity/Site";
import Datepicker, { type DateErrors } from "@/components/DatePicker.vue";
import CustomMultiselect from "@/components/MultiSelect.vue";
import type { Option } from "@/components/MultiSelect.vue";
import DataSearchResult from "@/components/DataSearchResult.vue";
import {
  constructTitle,
  dateToString,
  fixedRanges,
  getDateFromBeginningOfYear,
  getProductIcon,
  isSameDay,
  getMarkerIcon,
  getInstrumentIcon,
  backendUrl,
  compareValues,
  getPidIcon,
} from "@/lib";
import VizSearchResult from "@/components/VizSearchResult.vue";
import type { Product } from "@shared/entity/Product";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import SuperMap from "@/components/SuperMap.vue";
import { useRoute, useRouter } from "vue-router";
import ApiError from "./ApiError.vue";
import CheckBox from "@/components/CheckBox.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseAlert from "@/components/BaseAlert.vue";

import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";
import type { Instrument } from "@shared/entity/Instrument";
import { useRouteQuery, type QueryType } from "@/lib/useRouteQuery";

export interface Props {
  mode: string;
}

const queryString: QueryType<string> = {
  parse: (x) => x,
  format: (x) => x,
};

const queryStringArray: QueryType<string[]> = {
  parse: (x) => x.split(","),
  format: (x) => x.join(",") || undefined,
};

const queryBoolean: QueryType<boolean> = {
  parse: (x) => x === "true",
  format: (x) => (x ? "true" : undefined),
};

const props = defineProps<Props>();

function resetResponse() {
  return [];
}

const isVizMode = computed(() => props.mode == "visualizations");

// api call
const apiResponse = ref<SearchFileResponse[] | VisualizationResponse[]>(resetResponse());
let requestController: AbortController | null = null;

// file list
const isBusy = ref(false);

// site selector
const allSites = ref<Site[]>([]);
const selectedSiteIds = useRouteQuery({ name: "site", defaultValue: [], type: queryStringArray });
const showAllSites = ref(false);
const siteOptions = computed(() =>
  showAllSites.value ? allSites.value : allSites.value.filter((site) => site.type.includes("cloudnet" as SiteType)),
);

// dates
const beginningOfHistory = ref("1970-01-01");
const today = ref(dateToString(new Date()));
const dateFrom = useRouteQuery({ name: "dateFrom", defaultValue: today.value, type: queryString });
const dateFromError = ref<DateErrors>();
const dateTo = useRouteQuery({ name: "dateTo", defaultValue: today.value, type: queryString });
const dateToError = ref<DateErrors>();
const activeBtn = ref("");
const showDateRange = ref(false);

// products
const allProducts = ref<Product[]>([]);
const selectedProductIds = useRouteQuery({ name: "product", defaultValue: [], type: queryStringArray });
const showExpProducts = useRouteQuery({ name: "experimental", defaultValue: false, type: queryBoolean });
const productOptions = computed(() =>
  allProducts.value.filter((product) => showExpProducts.value || !product.experimental),
);

// variables
const selectedVariableIds = useRouteQuery({ name: "variable", defaultValue: [], type: queryStringArray });
const variableOptions = computed(() => {
  const formatProduct = (prod: Product) => prod.variables.map((variable) => ({ ...variable, product: prod }));
  if (selectedProductIds.value.length == 0) {
    return allProducts.value.flatMap(formatProduct);
  }
  return allProducts.value.filter((prod) => selectedProductIds.value.includes(prod.id)).flatMap(formatProduct);
});

// instruments
const allInstruments = ref<Instrument[]>([]);
const selectedInstrumentIds = useRouteQuery({ name: "instrument", defaultValue: [], type: queryStringArray });

// instrument PIDs
export interface InstrumentPid {
  id: string;
  humanReadableName: string;
}

const allInstrumentPids = ref<InstrumentPid[]>([]);
const selectedInstrumentPids = useRouteQuery({ name: "instrumentPid", defaultValue: [], type: queryStringArray });

const shouldOpenDetails = computed(() => {
  return selectedInstrumentPids.value.length > 0;
});

const detailsSection = ref(null);
const detailsOpen = ref(false);

// other
const renderComplete = ref(false);
const vizWideMode = ref(false);
const error = ref(null);

// keys
const dateFromUpdate = ref(10000);
const dateToUpdate = ref(20000);
const vizDateUpdate = ref(30000);
const dataSearchUpdate = ref(40000);
const vizSearchUpdate = ref(50000);
const mapKey = ref(60000);

const router = useRouter();
const route = useRoute();

onMounted(async () => {
  window.addEventListener("keydown", onKeyDown);
  await initView();
  renderComplete.value = true;
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

async function initView() {
  showDateRange.value = dateFrom.value !== dateTo.value;
  const [sites, products, instruments, pids] = await Promise.all([
    initSites(),
    axios.get(`${backendUrl}products/variables`),
    axios.get(`${backendUrl}instruments`),
    axios.get(`${backendUrl}raw-files/instrumentPids`),
  ]);
  allSites.value = sites.sort(alphabeticalSort);
  allProducts.value = products.data.sort(alphabeticalSort);
  allInstruments.value = instruments.data.sort(instrumentSort);
  allInstrumentPids.value.push(
    ...pids.data.sort().map((pid: string) => ({ id: pid, humanReadableName: pid.split("/").pop() })),
  );

  if (
    !showExpProducts.value &&
    selectedProductIds.value.some((productId) => {
      const product = allProducts.value.find((product) => product.id === productId);
      return product && product.experimental;
    })
  ) {
    showExpProducts.value = true;
  }
  showAllSites.value = selectedSiteIds.value.some((siteId) => {
    const site = allSites.value.find((site) => site.id === siteId);
    return site && !site.type.includes("cloudnet" as SiteType);
  });

  if (selectedInstrumentPids.value.length > 0 && detailsSection.value) {
    (detailsSection.value as HTMLDetailsElement).open = true;
    detailsOpen.value = true;
  }
}

async function initSites(): Promise<Site[]> {
  const res = await axios.get<Site[]>(`${backendUrl}sites/`, { params: { type: ["cloudnet", "campaign", "arm"] } });
  return res.data.filter((site) => !site.type.includes("hidden" as SiteType));
}

function fetchData() {
  if (requestController) requestController.abort();
  requestController = new AbortController();
  return new Promise((resolve, reject) => {
    if (isVizMode.value && noSelectionsMade.value) {
      resolve(undefined);
      return;
    }
    isBusy.value = true;
    const apiPath = isVizMode.value ? "visualizations/" : "search/";
    if (!isVizMode.value) checkIfButtonShouldBeActive();

    const payload = {
      site: selectedSiteIds.value.length ? selectedSiteIds.value : siteOptions.value.map((site) => site.id),
      dateFrom: isVizMode.value ? dateTo.value : dateFrom.value,
      dateTo: dateTo.value,
      product: selectedProductIds.value.length ? selectedProductIds.value : productOptions.value.map((prod) => prod.id),
      variable: isVizMode.value ? selectedVariableIds.value : undefined,
      instrument: selectedInstrumentIds.value.length ? selectedInstrumentIds.value : undefined,
      instrumentPid: selectedInstrumentPids.value.length ? selectedInstrumentPids.value : undefined,
      showLegacy: true,
      privateFrontendOrder: true,
    };
    return axios
      .get(`${backendUrl}${apiPath}`, { params: payload, signal: requestController!.signal })
      .then((res) => {
        apiResponse.value = constructTitle(res.data);
        isBusy.value = false;
        resolve(undefined);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error(err);
        error.value = (err.response && err.response.statusText) || "unknown error";
        apiResponse.value = resetResponse();
        isBusy.value = false;
        reject();
      });
  });
}

function setVizWideMode(wide: boolean) {
  vizWideMode.value = wide;
  mapKey.value = mapKey.value + 1;
}

function isTrueOnBothDateFields(errorId: keyof DateErrors) {
  if (!showDateRange.value) {
    return dateToError.value && dateToError.value[errorId];
  }
  return dateFromError.value && dateToError.value && dateFromError.value[errorId] && dateToError.value[errorId];
}

function onMapMarkerClick(ids: string[]) {
  const union = selectedSiteIds.value.concat(ids);
  const intersection = selectedSiteIds.value.filter((id) => ids.includes(id));
  selectedSiteIds.value = union.filter((id) => !intersection.includes(id));
}

const alphabeticalSort = (a: Option, b: Option) => compareValues(a.humanReadableName, b.humanReadableName);

const instrumentSort = (a: Instrument, b: Instrument) =>
  a.type == b.type
    ? compareValues(a.shortName || a.humanReadableName, b.shortName || b.humanReadableName)
    : compareValues(a.type, b.type);

const getVariableIcon = (variable: any) => getProductIcon(variable.product);

function navigateToSearch(mode: string) {
  router.push({ name: "Search", params: { mode }, query: route.query }).catch(() => {
    // Ignore useless error when URL doesn't change.
  });
}

function setDateRange(n: number) {
  dateTo.value = dateToString(new Date());
  const date = new Date();
  date.setDate(date.getDate() - n);
  dateFrom.value = dateToString(date);
  showDateRange.value = n != 0;
}

function setDateRangeForCurrentYear() {
  dateTo.value = dateToString(new Date());
  dateFrom.value = dateToString(getDateFromBeginningOfYear());
  showDateRange.value = true;
}

function onKeyDown(event: KeyboardEvent) {
  if (!document.activeElement || document.activeElement.tagName != "INPUT") {
    if (event.code == "ArrowLeft") setPreviousDate();
    else if (event.code == "ArrowRight") setNextDate();
  }
}

function hasNextDate() {
  return !isSameDay(new Date(dateTo.value), new Date());
}

function hasPreviousDate() {
  return !isSameDay(new Date(dateTo.value), new Date(beginningOfHistory.value));
}

function setPreviousDate() {
  if (!showDateRange.value && hasPreviousDate()) {
    const date = new Date(dateTo.value);
    date.setUTCDate(date.getUTCDate() - 1);
    dateTo.value = dateFrom.value = dateToString(date);
  }
}

function setNextDate() {
  if (!showDateRange.value && hasNextDate()) {
    const date = new Date(dateTo.value);
    date.setUTCDate(date.getUTCDate() + 1);
    dateTo.value = dateFrom.value = dateToString(date);
  }
}

function checkIfButtonShouldBeActive() {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    Math.abs((new Date(dateTo.value).valueOf() - new Date(dateFrom.value).valueOf()) / oneDay),
  );
  const isDateToToday = isSameDay(new Date(dateTo.value), new Date());
  const isDateFromBeginningOfYear = isSameDay(new Date(dateFrom.value), getDateFromBeginningOfYear());
  if (isDateToToday && isDateFromBeginningOfYear) activeBtn.value = "btn1";
  else if (isDateToToday && diffDays === fixedRanges.month) activeBtn.value = "btn2";
  else if (isDateToToday && diffDays === fixedRanges.day) activeBtn.value = "btn3";
  else activeBtn.value = "";
}

const mainWidth = computed(() => {
  if (isVizMode.value) {
    if (vizWideMode.value) return { wideView: true };
    else return { pagewidth: true };
  }
  return { pagewidth: true };
});

const noSelectionsMade = computed(() => {
  return !(
    selectedProductIds.value.length ||
    selectedSiteIds.value.length ||
    selectedVariableIds.value.length ||
    selectedInstrumentIds.value.length ||
    selectedInstrumentPids.value.length
  );
});

watch(
  () => [
    renderComplete.value,
    dateFrom.value,
    dateTo.value,
    selectedSiteIds.value,
    selectedInstrumentIds.value,
    selectedProductIds.value,
    selectedVariableIds.value,
    selectedInstrumentPids.value,
    siteOptions.value,
    productOptions.value,
  ],
  async () => {
    if (!renderComplete.value) return;
    await fetchData();
  },
  { immediate: true },
);

watch(
  () => dateTo.value,
  (newValue) => {
    if (!showDateRange.value) {
      dateFrom.value = newValue;
    }
  },
);

watch(
  () => showDateRange.value,
  (enabled) => {
    if (!enabled) {
      dateFrom.value = dateTo.value;
    }
  },
);

watch(
  () => props.mode,
  async (nextMode) => {
    renderComplete.value = false;
    apiResponse.value = resetResponse();
    dateFromUpdate.value = dateFromUpdate.value + 1;
    dateToUpdate.value = dateToUpdate.value + 1;
    vizDateUpdate.value = vizDateUpdate.value + 1;
    dataSearchUpdate.value = dataSearchUpdate.value + 1;
    vizSearchUpdate.value = vizSearchUpdate.value + 1;
    mapKey.value = mapKey.value + 1;
    if (nextMode == "visualizations") {
      dateFrom.value = dateTo.value;
      showDateRange.value = false;
    }
    renderComplete.value = true;
  },
);
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

$lightpadding: 1rem;
$heavypadding: 5rem;
$filter-margin: 2em;

main#search {
  padding-left: $lightpadding;
  padding-right: $lightpadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
}

main#search.mediumView {
  max-width: 90em;
}

main#search.wideView {
  max-width: none;
  padding-left: $heavypadding;
  padding-right: $heavypadding;
}

a:focus {
  outline: thin dotted;
}

section#sideBar {
  margin-right: 80px;
  width: 300px;
  padding: 2rem 0;
  flex-basis: 300px;
  flex-shrink: 0;
}

@media screen and (max-width: $page-width) {
  main#search.wideView {
    padding-left: $lightpadding;
    padding-right: $lightpadding;
  }
}

@media screen and (max-width: $narrow-screen) {
  #searchContainer {
    flex-direction: column;
    align-items: center;
  }

  .results {
    width: 100%;
  }

  section#sideBar {
    margin-right: 0;
  }
}

div.date {
  display: grid;
  grid-template-columns: 42.5% 15% 42.5%;
  justify-items: center;
  row-gap: 0.5em;

  .date {
    outline: none;
  }
}

#noRes {
  font-size: 90%;
  color: gray;
}

#reset {
  cursor: pointer;
  text-decoration: underline;
  color: #bcd2e2;
  margin-top: 1rem;
  display: block;
}

.multiselect--disabled {
  .multiselect__select {
    background: none;
  }
}

.results {
  display: inline-flex;
  flex-grow: 1;
}

.widebutton {
  width: 100%;
  margin: 0 auto $filter-margin;

  &:focus {
    outline: thin dotted;
  }
}

.no-padding {
  padding: 0;
}

.quickselectors {
  width: 100%;
  height: 27px;
  display: flex;
  margin-bottom: 0.6em;
  gap: 0.6rem;

  .quickBtn {
    color: black;
    height: 25px;
    padding: 10px;
    font-size: 80%;
    line-height: 0;
    margin-right: 0;
    border: 1px solid $steel-warrior;
    border-radius: 3px;
    background-color: $blue-dust;
    flex-grow: 1;
    text-align: center;

    &:hover {
      background-color: $steel-warrior;
    }

    &:focus {
      outline: thin dotted;
    }

    &:active {
      outline: none;
    }
  }

  .activeBtn {
    background-color: $steel-warrior;
    border: 1px solid darkgray;

    &:focus {
      outline: none;
    }
  }
}

.dateButtons {
  width: 80%;
  height: 32px;
  display: flex;
  margin-left: 8em;

  .dateBtn:disabled {
    opacity: 0.5;
  }

  .dateBtn:hover:enabled {
    background-color: $steel-warrior;
  }
}

span.centerlabel {
  line-height: 30px;
  font-size: 80%;
}

.widemap.wideviz {
  left: $heavypadding;
  right: $heavypadding;
}

.widemapmarginleft {
  margin-top: -20px;
}

.widemapmarginright {
  margin-top: 450px;
}

@media screen and (max-width: $narrow-screen) {
  .widemapmarginright {
    margin-top: 0px;
  }
}

@media screen and (max-width: $medium-screen) {
  .widemapmarginright {
    margin-top: 0px;
  }
}

:deep(.rowtags) {
  display: flex;
  gap: 0.25em;
  justify-content: center;
}

:deep(.rowtag) {
  display: inline-block;
  min-width: 1em;
  min-height: 1em;
  font-size: 0.9em;
  text-align: center;
  padding: 0.2em;
  border-radius: 0.25rem;

  &.volatile {
    background: #cad7ff;
  }

  &.legacy {
    background: #cecece;
  }

  &.experimental {
    background-color: $experimental;
  }
}

.smallmap {
  height: 300px;
}

.widemap {
  height: 450px;
  margin-top: 1rem;
}

.filterbox {
  margin-top: 1rem;
}

.checkbox {
  margin-top: 0.25rem;
}

summary {
  margin-left: 15px;
  margin-top: 15px;
  cursor: pointer;
  list-style: disclosure-closed;
}

details[open] summary {
  list-style: disclosure-open;
}
</style>
