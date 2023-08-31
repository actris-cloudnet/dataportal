<style lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"

$lightpadding: 1em
$heavypadding: 5em

main#search
  position: relative
  display: flex
  justify-content: center
  flex-wrap: wrap
  padding-left: $lightpadding
  padding-right: $lightpadding

main#search.mediumView
  max-width: 90em

main#search.wideView
  max-width: none
  padding-left: $heavypadding
  padding-right: $heavypadding

a:focus
  outline: thin dotted

.rednote
  border-color: #ffcfcf
  background: #fde5e5

.close
  float: right
  font-weight: bold
  color: lightgrey
  cursor: pointer
  margin-left: 1em

.rednote>.close
  color: grey
  font-weight: normal

section#sideBar
  margin-right: 80px
  width: 300px

@media screen and (max-width: $narrow-screen)
  section#sideBar
    margin-right: 0
@media screen and (max-width: $medium-screen)
  section#sideBar
    margin-left: 80px
    margin-right: 80px

.multiselect
  margin-bottom: $filter-margin

div.date
  display: grid
  grid-template-columns: 42.5% 15% 42.5%
  justify-items: center
  row-gap: 0.5em
  margin-bottom: $filter-margin
  .date
    outline: none

button.calendar
  display: flex
  align-items: center
  justify-content: center

  width: 2em
  height: 100%
  background-color: $blue-dust
  color: white
  border: 1px solid $steel-warrior
  border-radius: 0 2px 2px 0
  font-size: 1em
  cursor: pointer
  &:focus
    background-color: $steel-warrior
    outline: none
  &:hover
    background-color: $steel-warrior
  &:active
    background-color: $steel-warrior
    border-color: $blue-dust
  &>svg
    color: black
    width: 1em
    height: 1em

label, span.filterlabel
  font-size: 0.9em
  margin-bottom: 0
  &::after
    content: ':'

#noRes
  font-size: 90%
  color: gray

#reset
  cursor: pointer
  text-decoration: underline
  color: #bcd2e2
  margin-bottom: $filter-margin
  display: block

.disabled
  opacity: 0.5

.hidden
  display: none

.multiselect--disabled
  .multiselect__select
    background: none

.results
  margin-top: 15px
  display: inline-flex
  flex-grow: 1
  min-width: 600px
  flex-basis: 600px

@media screen and (max-width: 1010px)
  .results
    min-width: 0

.widebutton
  width: 100%
  margin: 0 auto $filter-margin

  &:focus
    outline: thin dotted

.no-padding
  padding: 0

.quickselectors
  width: 100%
  height: 27px
  display: flex
  margin-bottom: 0.6em
  gap: .6rem
  .quickBtn
    color: black
    height: 25px
    padding: 10px
    font-size: 80%
    line-height: 0
    margin-right: 0
    border: 1px solid $steel-warrior
    border-radius: 3px
    background-color: $blue-dust
    flex-grow: 1
    &:hover
      background-color: $steel-warrior
    &:focus
      outline: thin dotted
    &:active
      outline: none
  .activeBtn
    background-color: $steel-warrior
    border: 1px solid darkgray
    &:focus
      outline: none

.dateButtons
  width: 80%
  height: 32px
  display: flex
  margin-top: 1.5em
  margin-left: 8.0em
  .dateBtn:disabled
    opacity: 0.5
  .dateBtn:hover:enabled
    background-color: $steel-warrior
  .dateBtn
    padding-left: 10px
    padding-right: 10px
    margin-right: 12px
    border: 1px solid $steel-warrior
    border-radius: 3px
    background-color: $blue-dust
    &:focus
      outline: thin dotted
    .dateIcon
      height: 1.5em
      width: auto
      margin-right: 1.5em
span.centerlabel
  line-height: 30px
  font-size: 80%

.widemap.wideviz
  left: $heavypadding
  right: $heavypadding

.widemapmarginleft
  margin-top: -20px

.widemapmarginright
  margin-top: 450px
@media screen and (max-width: $narrow-screen)
  .widemapmarginright
    margin-top: 0px
@media screen and (max-width: $medium-screen)
  .widemapmarginright
    margin-top: 0px

div.checkbox
  position: relative
  top: -1.5em
  margin-bottom: 1em
  display: flex
  flex-direction: row
  align-items: center
  label
    margin-left: 0.5em
    margin-top: 0
    &::after
      content: ''

.rowtags
  display: flex
  gap: .25em
  justify-content: center

.rowtag
  display: inline-block
  min-width: 1em
  min-height: 1em
  font-size: 0.9em
  text-align: center
  padding: 0.2em
  border-radius: .25rem

.volatile
  background: #cad7ff

.legacy
  background: #cecece

.experimental
  background-color: #EC9706
</style>

<template>
  <main v-if="mode === 'visualizations' || mode === 'data'" id="search" :class="mainWidth">
    <div v-if="error" class="note rednote">Error: Search backend is offline, {{ error }}</div>

    <section id="sideBar">
      <div :class="{ widemap: showAllSites, wideviz: vizWideMode }">
        <MyMap
          v-if="allSites && allSites.length > 0"
          :key="mapKey"
          :sites="allSites"
          :selectedSiteIds="selectedSiteIds"
          :onMapMarkerClick="onMapMarkerClick"
          :center="[54.0, 14.0]"
          :zoom="showAllSites ? 2 : 3"
          :showLegend="showAllSites"
          :enableBoundingBox="true"
        />
      </div>

      <custom-multiselect
        label="Location"
        v-model="selectedSiteIds"
        :options="allSites"
        id="siteSelect"
        class="nobottommargin"
        :class="{ widemapmarginleft: showAllSites }"
        :multiple="true"
        :getIcon="getMarkerIcon"
      />
      <div class="checkbox">
        <input type="checkbox" id="showAllSitesCheckbox" name="showAllSitesCheckbox" v-model="showAllSites" />
        <label for="showAllSitesCheckbox">Show all sites</label>
      </div>

      <span class="filterlabel" v-if="!isVizMode">Date</span>
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

      <div class="date" v-if="!isVizMode">
        <template v-if="showDateRange">
          <datepicker
            name="dateFrom"
            v-model="dateFrom"
            :start="beginningOfHistory"
            :end="dateTo"
            @error="dateFromError = $event"
            :key="dateFromUpdate"
          />
          <span class="centerlabel">&#8212;</span>
        </template>
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
          <div v-if="!isTrueOnBothDateFields('isNotInFuture')" class="errormsg">Provided date is in the future.</div>
          <div
            v-if="(dateFromError && !dateFromError.isBeforeEnd) || (dateToError && !dateToError.isAfterStart)"
            class="errormsg"
          >
            Start date must be before end date.
          </div>
        </template>
      </div>

      <div class="checkbox" v-if="!isVizMode">
        <input type="checkbox" id="showDateRangeCheckbox" name="showDateRangeCheckbox" v-model="showDateRange" />
        <label for="showDateRangeCheckbox">Show date range</label>
      </div>

      <div class="date" v-if="isVizMode">
        <datepicker
          label="Date"
          name="dateTo"
          v-model="dateTo"
          :start="beginningOfHistory"
          :end="today"
          @error="dateToError = $event"
          :key="vizDateUpdate"
        />
        <div class="dateButtons">
          <button id="previousBtn" class="dateBtn" @click="setPreviousDate()" :disabled="!hasPreviousDate()">
            <img alt="calendar" class="dateIcon" :src="datePreviousIcon" />
          </button>
          <button id="nextBtn" class="dateBtn" @click="setNextDate()" :disabled="!hasNextDate()">
            <img alt="calendar" class="dateIcon" :src="dateNextIcon" />
          </button>
        </div>
        <div v-if="dateToError && !dateToError.isValidDateString" class="errormsg">
          Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
        </div>
        <div v-if="dateToError && dateToError.isValidDateString && !dateToError.isNotInFuture" class="errormsg">
          Provided date is in the future.
        </div>
      </div>

      <custom-multiselect
        label="Product"
        v-model="selectedProductIds"
        :options="allProducts"
        id="productSelect"
        :multiple="true"
        :getIcon="getProductIcon"
      />
      <div class="checkbox">
        <input type="checkbox" id="showExpProductsCheckbox" name="showExpProductsCheckbox" v-model="showExpProducts" />
        <label for="showExpProductsCheckbox">Show experimental products</label>
      </div>

      <custom-multiselect
        v-show="isVizMode"
        label="Variable"
        v-model="selectedVariableIds"
        :options="selectableVariables"
        :multiple="true"
        id="variableSelect"
      />

      <button v-if="isVizMode" @click="navigateToSearch('data')" class="secondaryButton widebutton">
        View in data search &rarr;
      </button>
      <button v-else @click="navigateToSearch('visualizations')" class="secondaryButton widebutton">
        View in visualization search &rarr;
      </button>

      <a @click="reset" id="reset">Reset filter</a>
    </section>

    <div class="results" :class="{ widemapmarginright: showAllSites }">
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
        :downloadUri="downloadUri"
        :key="dataSearchUpdate"
      />
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
import { ref, computed, onMounted, nextTick, watch } from "vue";
import axios from "axios";
import type { Site } from "@shared/entity/Site";
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
  isValidDate,
  getMarkerIcon,
} from "@/lib";
import VizSearchResult from "@/components/VizSearchResult.vue";
import type { Product } from "@shared/entity/Product";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";
import MyMap from "@/components/SuperMap.vue";
import { useRoute, useRouter } from "vue-router";
import ApiError from "./ApiError.vue";

import datePreviousIcon from "@/assets/icons/date-previous.png";
import dateNextIcon from "@/assets/icons/date-next.png";
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";

export interface Props {
  mode: string;
}

const props = defineProps<Props>();

function resetResponse() {
  return [];
}

const isVizMode = computed(() => props.mode == "visualizations");

function getInitialDateFrom() {
  const date = new Date();
  return new Date(date.setDate(date.getDate() - fixedRanges.day));
}

// api call
const apiUrl = import.meta.env.VITE_BACKEND_URL;
const apiResponse = ref<SearchFileResponse[] | VisualizationResponse[]>(resetResponse());
const pendingUpdates = ref(false);

// file list
const isBusy = ref(false);

// site selector
const normalSites = ref<Site[]>([]);
const extraSites = ref<Site[]>([]);
const allSites = ref<Site[]>([]); // options in site selector
const normalSiteIds = ref<string[]>([]);
const extraSiteIds = ref<string[]>([]);
const selectedSiteIds = ref<string[]>([]);
const showAllSites = ref(false);

// dates
const beginningOfHistory = ref(new Date("1970-01-01"));
const today = ref(new Date());
const dateTo = ref(new Date());
const dateFrom = ref(isVizMode.value ? new Date() : getInitialDateFrom());
const dateFromError = ref<DateErrors>();
const dateToError = ref<DateErrors>();
const activeBtn = ref("");
const showDateRange = ref(false);

// products
const normalProducts = ref<Product[]>([]);
const experimentalProducts = ref<Product[]>([]);
const allProducts = ref<Product[]>([]); // options in product selector
const normalProductIds = ref<string[]>([]);
const experimentalProductIds = ref<string[]>([]);
const selectedProductIds = ref<string[]>([]);
const showExpProducts = ref(false);

// variables
const experimentalVariableIds = ref<string[]>([]);
const selectedVariableIds = ref<string[]>([]);

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
  nextTick(() => {
    renderComplete.value = true;
  });
  addKeyPressListener();
  await initView();
  const query = route.query;
  const params = ["site", "product", "variable", "dateFrom", "dateTo"];
  const paramsSet = params.filter((param) => param in query && query[param] != null);
  for (const param of paramsSet) {
    const value = route.query[param] as string;
    if (param === "site") selectedSiteIds.value = parseQuery(param, value);
    if (param === "product") selectedProductIds.value = parseQuery(param, value);
    if (param === "variable") selectedVariableIds.value = parseQuery(param, value);
    if (param === "dateFrom" || param === "dateTo") {
      if (isValidDate(value)) {
        const date = new Date(value);
        if (param === "dateFrom") {
          dateFrom.value = date;
        } else {
          dateTo.value = date;
        }
      }
    }
  }
  showDateRange.value = !isSameDay(dateFrom.value, dateTo.value);
  if (paramsSet.length === 0) {
    await fetchData();
  }
});

async function initView() {
  const sitesPayload = {
    params: { type: ["cloudnet", "campaign", "arm"] },
  };
  await Promise.all([axios.get(`${apiUrl}sites/`, sitesPayload), axios.get(`${apiUrl}products/variables`)]).then(
    ([sites, products]) => {
      allSites.value = sites.data.sort(alphabeticalSort).filter(selectNormalSites);
      normalSites.value = sites.data.sort(alphabeticalSort).filter(selectNormalSites);
      extraSites.value = sites.data.sort(alphabeticalSort).filter(selectExtraSites);
      normalSiteIds.value = normalSites.value.map((site) => site.id);
      extraSiteIds.value = extraSites.value.map((site) => site.id);
      allProducts.value = products.data.filter(discardExperimentalProducts).sort(alphabeticalSort);
      normalProducts.value = products.data.filter((prod: Product) => !prod.experimental).sort(alphabeticalSort);
      experimentalProducts.value = products.data.filter((prod: Product) => prod.experimental).sort(alphabeticalSort);
      normalProductIds.value = normalProducts.value.map((prod) => prod.id);
      experimentalProductIds.value = experimentalProducts.value.map((prod) => prod.id);
      experimentalVariableIds.value = experimentalProducts.value
        .flatMap((prod) => prod.variables)
        .map((prod) => prod.id);
    },
  );
}

function parseQuery(param: string, value: string): string[] {
  let validChoices: string | string[];
  const valueArray = value.split(",");
  if (param === "product") {
    for (const productId of valueArray) {
      if (experimentalProductIds.value.includes(productId) && !showExpProducts.value) {
        showExpProducts.value = true;
        allProducts.value = normalProducts.value.concat(experimentalProducts.value);
      }
    }
    validChoices = normalProductIds.value.concat(experimentalProductIds.value);
  }
  if (param === "site") {
    for (const siteId of valueArray) {
      if (extraSiteIds.value.includes(siteId) && !showAllSites.value) {
        showAllSites.value = true;
        allSites.value = normalSites.value.concat(extraSites.value);
      }
    }
    validChoices = allSites.value.map((site) => site.id);
  }
  if (param === "variable") {
    validChoices = allProducts.value.flatMap((prod) => prod.variables).map((variable) => variable.id);
  }
  const validValues = valueArray.filter((value) => validChoices.includes(value));
  return Array.from(new Set(validValues));
}

function fetchData() {
  if (pendingUpdates.value) return Promise.resolve();
  pendingUpdates.value = true;
  return new Promise((resolve, reject) => {
    nextTick(() => {
      pendingUpdates.value = false;
      if (isVizMode.value && noSelectionsMade.value) {
        resolve(undefined);
        return;
      }
      isBusy.value = true;
      const apiPath = isVizMode.value ? "visualizations/" : "search/";
      if (!isVizMode.value) checkIfButtonShouldBeActive();
      return axios
        .get(`${apiUrl}${apiPath}`, payload.value)
        .then((res) => {
          apiResponse.value = constructTitle(res.data);
          isBusy.value = false;
          resolve(undefined);
        })
        .catch((err) => {
          console.error(err);
          error.value = (err.response && err.response.statusText) || "unknown error";
          apiResponse.value = resetResponse();
          isBusy.value = false;
          reject();
        });
    });
  });
}

function dateErrorsExist(dateError?: DateErrors) {
  return !(
    dateError &&
    dateError.isValidDateString &&
    dateError.isAfterStart &&
    dateError.isBeforeEnd &&
    dateError.isNotInFuture
  );
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

const alphabeticalSort = (a: Option, b: Option) => a.humanReadableName > b.humanReadableName;

const selectNormalSites = (site: Site) => (site.type as string[]).includes("cloudnet");

const selectExtraSites = (site: Site) => !(site.type as string[]).includes("cloudnet");

function discardExperimentalProducts(prod: Product) {
  return showExpProducts.value || !prod.experimental;
}

function navigateToSearch(mode: string) {
  router.push({ name: "Search", params: { mode }, query: route.query }).catch(() => {
    // Ignore useless error when URL doesn't change.
  });
}

function reset() {
  router.replace({ path: route.path, query: {} }).catch(() => {
    // Ignore useless error when URL doesn't change.
  });
  router.go(0);
}

function setDateRange(n: number) {
  dateTo.value = new Date();
  const date = new Date();
  date.setDate(date.getDate() - n);
  dateFrom.value = date;
  showDateRange.value = n != 0;
}

function setDateRangeForCurrentYear() {
  dateTo.value = new Date();
  dateFrom.value = getDateFromBeginningOfYear();
  showDateRange.value = true;
}

function addKeyPressListener() {
  window.addEventListener("keydown", (e) => {
    if (!document.activeElement || document.activeElement.tagName != "INPUT") {
      if (e.code == "ArrowLeft") setPreviousDate();
      else if (e.code == "ArrowRight") setNextDate();
    }
  });
}

function hasNextDate() {
  return !isSameDay(dateTo.value, new Date());
}

function hasPreviousDate() {
  return !isSameDay(dateTo.value, beginningOfHistory.value);
}

function setPreviousDate() {
  if (hasPreviousDate()) {
    const date = new Date(dateTo.value);
    date.setDate(date.getDate() - 1);
    dateTo.value = date;
  }
}

function setNextDate() {
  if (hasNextDate()) {
    const date = new Date(dateTo.value);
    date.setDate(date.getDate() + 1);
    dateTo.value = date;
  }
}

function checkIfButtonShouldBeActive() {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((dateTo.value.valueOf() - dateFrom.value.valueOf()) / oneDay));
  const isDateToToday = isSameDay(dateTo.value, new Date());
  const isDateFromBeginningOfYear = isSameDay(new Date(dateFrom.value), getDateFromBeginningOfYear());
  if (isDateToToday && isDateFromBeginningOfYear) activeBtn.value = "btn1";
  else if (isDateToToday && diffDays === fixedRanges.month) activeBtn.value = "btn2";
  else if (isDateToToday && diffDays === fixedRanges.day) activeBtn.value = "btn3";
  else activeBtn.value = "";
}

function replaceUrlQueryString(params: Record<string, Date | string[]>) {
  const query = { ...route.query };
  for (const [param, value] of Object.entries(params)) {
    const valueToUrl = value instanceof Date ? dateToString(value) : value.join(",");
    query[param] = valueToUrl === "" ? [] : valueToUrl;
  }
  router.replace({ path: route.path, query }).catch(() => {
    // Ignore useless error when URL doesn't change.
  });
}

const downloadUri = computed(() =>
  axios.getUri({
    ...{ method: "post", url: `${apiUrl}download/` },
    ...payload,
  }),
);

const payload = computed(() => {
  return {
    params: {
      site: selectedSiteIds.value.length ? selectedSiteIds.value : allSites.value.map((site) => site.id),
      dateFrom: isVizMode.value ? dateTo.value : dateFrom.value,
      dateTo: dateTo.value,
      product: selectedProductIds.value.length ? selectedProductIds.value : allProducts.value.map((prod) => prod.id),
      variable: isVizMode.value ? selectedVariableIds.value : undefined,
      showLegacy: true,
    },
  };
});

const mainWidth = computed(() => {
  if (isVizMode.value) {
    if (vizWideMode.value) return { wideView: true };
    else return { mediumView: true };
  }
  return { narrowView: true };
});

const selectableVariables = computed(() => {
  if (selectedProductIds.value.length == 0) {
    return allProducts.value.flatMap((prod) => prod.variables);
  }
  return allProducts.value
    .filter((prod) => selectedProductIds.value.includes(prod.id))
    .flatMap((prod) => prod.variables);
});

const noSelectionsMade = computed(() => {
  return !(selectedProductIds.value.length || selectedSiteIds.value.length || selectedVariableIds.value.length);
});

watch(
  () => selectedSiteIds.value,
  async () => {
    replaceUrlQueryString({ site: selectedSiteIds.value });
    await fetchData();
  },
);

watch(
  () => dateFrom.value,
  async () => {
    if (!renderComplete.value || dateErrorsExist(dateFromError.value)) return;
    replaceUrlQueryString({ dateFrom: dateFrom.value, dateTo: dateTo.value });
    await fetchData();
  },
);

watch(
  () => dateTo.value,
  async () => {
    if (!renderComplete.value || dateErrorsExist(dateToError.value)) return;
    if (isVizMode.value || !showDateRange.value) {
      dateFrom.value = dateTo.value;
    }
    replaceUrlQueryString({ dateFrom: dateFrom.value, dateTo: dateTo.value });
    await fetchData();
  },
);

watch(
  () => selectedProductIds.value,
  async () => {
    replaceUrlQueryString({ product: selectedProductIds.value });
    await fetchData();
  },
);

watch(
  () => selectedVariableIds.value,
  async () => {
    replaceUrlQueryString({ variable: selectedVariableIds.value });
    await fetchData();
  },
);

watch(
  () => showAllSites.value,
  async () => {
    if (!showAllSites.value) {
      // remove selected campaign and arm sites
      allSites.value = normalSites.value;
      selectedSiteIds.value = selectedSiteIds.value.filter((site) => !extraSiteIds.value.includes(site));
    } else {
      allSites.value = normalSites.value.concat(extraSites.value);
    }
    mapKey.value = mapKey.value + 1;
    await fetchData();
  },
);

watch(
  () => showExpProducts.value,
  async () => {
    if (!showExpProducts.value) {
      // remove selected experimental products and variables
      allProducts.value = normalProducts.value;
      selectedProductIds.value = selectedProductIds.value.filter(
        (prod) => !experimentalProductIds.value.includes(prod),
      );
      selectedVariableIds.value = selectedVariableIds.value.filter(
        (variable) => !experimentalVariableIds.value.includes(variable),
      );
    } else {
      allProducts.value = normalProducts.value.concat(experimentalProducts.value);
    }
    await fetchData();
  },
);

watch(
  () => allProducts.value,
  () => {
    showExpProducts.value = allProducts.value.length > normalProducts.value.length;
  },
);

watch(
  () => props.mode,
  async () => {
    renderComplete.value = false;
    apiResponse.value = resetResponse();
    dateFromUpdate.value = dateFromUpdate.value + 1;
    dateToUpdate.value = dateToUpdate.value + 1;
    vizDateUpdate.value = vizDateUpdate.value + 1;
    dataSearchUpdate.value = dataSearchUpdate.value + 1;
    vizSearchUpdate.value = vizSearchUpdate.value + 1;
    mapKey.value = mapKey.value + 1;
    await fetchData();
    renderComplete.value = true;
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
</script>
