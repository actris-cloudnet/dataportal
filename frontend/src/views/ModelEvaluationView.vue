<template>
  <main v-if="mode === 'visualizations' || mode === 'data'" id="search" class="pagewidth">
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
          <CustomMultiselect
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
            <DatePicker
              name="dateFrom"
              v-model="dateFrom"
              :start="beginningOfHistory"
              :end="dateTo"
              @error="dateFromError = $event"
              :key="dateFromUpdate"
            />
            <span class="centerlabel">&#8212;</span>
            <DatePicker
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
            <DatePicker
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
          <CustomMultiselect
            label="Model"
            v-model="selectedModelIds"
            :options="modelOptions"
            id="modelSelect"
            :multiple="true"
          />
        </div>

        <div class="filterbox">
          <CustomMultiselect
            label="Product"
            v-model="selectedProductIds"
            :options="productOptions"
            id="productSelect"
            :multiple="true"
            :getIcon="getProductIcon"
          />
        </div>

        <div class="filterbox" v-show="isVizMode">
          <CustomMultiselect
            label="Variable"
            v-model="selectedVariableIds"
            :options="variableOptions"
            :multiple="true"
            id="variableSelect"
            :getIcon="getVariableIcon"
          />
        </div>

        <div class="filterbox">
          <BaseButton v-if="isVizMode" :to="routeToSearch('data')" type="secondary" style="width: 100%">
            View in data search &rarr;
          </BaseButton>
          <BaseButton v-else :to="routeToSearch('visualizations')" type="secondary" style="width: 100%">
            View in visualization search &rarr;
          </BaseButton>
          <a :href="isVizMode ? '/model-evaluation/visualizations' : '/model-evaluation/data'" id="reset">
            Reset filter
          </a>
        </div>
      </section>

      <div class="results">
        <VizSearchResult
          v-if="isVizMode && renderComplete"
          :key="vizSearchUpdate"
          :setWideMode="() => {}"
          :sites="selectedSiteIds"
          :date="dateTo"
          :products="selectedProductIds"
          :models="selectedModelIds"
          :variables="selectedVariableIds"
          :defaultProducts="productOptions.map((prod) => prod.id)"
          :defaultSites="siteOptions.map((site) => site.id)"
        />
        <ModelEvaluationResult
          v-else-if="renderComplete"
          :key="dataSearchUpdate"
          :sites="selectedSiteIds.length ? selectedSiteIds : siteOptions.map((site) => site.id)"
          :dateFrom="dateFrom"
          :dateTo="dateTo"
          :models="selectedModelIds"
          :modelProducts="selectedModelProductIds"
          :evalProducts="selectedEvalProductIds"
          padding-top="2rem"
        />
      </div>
    </div>
  </main>
  <ApiError v-else :response="{ status: 404, data: 'Not found' }" />
</template>

<script lang="ts">
export default {
  name: "app-model-evaluation",
};
</script>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import axios from "axios";
import type { Site } from "@shared/entity/Site";
import DatePicker, { type DateErrors } from "@/components/DatePicker.vue";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import ModelEvaluationResult from "@/components/ModelEvaluationResult.vue";
import {
  dateToString,
  fixedRanges,
  getDateFromBeginningOfYear,
  getProductIcon,
  isSameDay,
  getMarkerIcon,
  backendUrl,
  compareValues,
} from "@/lib";
import VizSearchResult from "@/components/VizSearchResult.vue";
import { isEarthCareProduct, type Product } from "@shared/entity/Product";
import type { Model } from "@shared/entity/Model";
import SuperMap from "@/components/SuperMap.vue";
import { useRoute } from "vue-router";
import ApiError from "./ApiError.vue";
import CheckBox from "@/components/CheckBox.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseAlert from "@/components/BaseAlert.vue";
import { useRouteQuery, queryString, queryStringArray } from "@/lib/useRouteQuery";

export interface Props {
  mode: string;
}

const props = defineProps<Props>();

const isVizMode = computed(() => props.mode == "visualizations");

// site selector
const allSites = ref<Site[]>([]);
const selectedSiteIds = useRouteQuery({
  name: "site",
  defaultValue: [],
  type: queryStringArray,
});
const showAllSites = ref(false);
const siteOptions = computed(() =>
  showAllSites.value ? allSites.value : allSites.value.filter((site) => site.type.includes("cloudnet")),
);

// dates
const beginningOfHistory = ref("1970-01-01");
const today = ref(dateToString(new Date()));
const dateFrom = useRouteQuery({
  name: "dateFrom",
  defaultValue: today.value,
  type: queryString,
});
const dateFromError = ref<DateErrors>();
const dateTo = useRouteQuery({
  name: "dateTo",
  defaultValue: today.value,
  type: queryString,
});
const dateToError = ref<DateErrors>();
const showDateRange = ref(false);

// products (only model and evaluation products are relevant here)
const allProducts = ref<Product[]>([]);
const selectedProductIds = useRouteQuery({
  name: "product",
  defaultValue: [],
  type: queryStringArray,
});
const productOptions = computed(() =>
  allProducts.value.filter(
    (product) =>
      // EarthCARE products are out of scope for model evaluation.
      !isEarthCareProduct(product.id) && (product.type.includes("model") || product.type.includes("evaluation")),
  ),
);
const isModelProduct = (id: string) => allProducts.value.find((p) => p.id === id)?.type.includes("model");
const isEvalProduct = (id: string) => allProducts.value.find((p) => p.id === id)?.type.includes("evaluation");
const allModelProductIds = computed(() =>
  productOptions.value.filter((p) => p.type.includes("model")).map((p) => p.id),
);
const allEvalProductIds = computed(() =>
  productOptions.value.filter((p) => p.type.includes("evaluation")).map((p) => p.id),
);
const selectedModelProductIds = computed(() =>
  selectedProductIds.value.length ? selectedProductIds.value.filter(isModelProduct) : allModelProductIds.value,
);
const selectedEvalProductIds = computed(() =>
  selectedProductIds.value.length ? selectedProductIds.value.filter(isEvalProduct) : allEvalProductIds.value,
);

// models
const allModels = ref<Model[]>([]);
const selectedModelIds = useRouteQuery({
  name: "model",
  defaultValue: [],
  type: queryStringArray,
});
const modelOptions = computed(() => allModels.value);

// variables
const selectedVariableIds = useRouteQuery({
  name: "variable",
  defaultValue: [],
  type: queryStringArray,
});
const variableOptions = computed(() => {
  const formatProduct = (prod: Product) => prod.variables.map((variable) => ({ ...variable, product: prod }));
  if (selectedProductIds.value.length == 0) {
    return productOptions.value.flatMap(formatProduct);
  }
  return productOptions.value.filter((prod) => selectedProductIds.value.includes(prod.id)).flatMap(formatProduct);
});

// other
const renderComplete = ref(false);
const error = ref(null);

// keys
const dateFromUpdate = ref(10000);
const dateToUpdate = ref(20000);
const vizDateUpdate = ref(30000);
const dataSearchUpdate = ref(40000);
const vizSearchUpdate = ref(50000);
const mapKey = ref(60000);

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
  const [sites, products, models] = await Promise.all([
    initSites(),
    axios.get<Product[]>(`${backendUrl}products/variables`),
    axios.get<Model[]>(`${backendUrl}models`),
  ]);
  allSites.value = sites.sort(alphabeticalSort);
  allProducts.value = products.data.sort(alphabeticalSort);
  allModels.value = models.data;

  showAllSites.value = selectedSiteIds.value.some((siteId) => {
    const site = allSites.value.find((site) => site.id === siteId);
    return site && !site.type.includes("cloudnet");
  });
}

async function initSites(): Promise<Site[]> {
  const res = await axios.get<Site[]>(`${backendUrl}sites/`, {
    params: { type: ["cloudnet", "campaign", "arm", "weather-radar"] },
  });
  return res.data.filter((site) => !site.type.includes("hidden"));
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

const getVariableIcon = (variable: any) => getProductIcon(variable.product);

function routeToSearch(mode: string) {
  return { name: "ModelEvaluation", params: { mode }, query: route.query };
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

const activeBtn = computed(() => {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    Math.abs((new Date(dateTo.value).valueOf() - new Date(dateFrom.value).valueOf()) / oneDay),
  );
  const isDateToToday = isSameDay(new Date(dateTo.value), new Date());
  const isDateFromBeginningOfYear = isSameDay(new Date(dateFrom.value), getDateFromBeginningOfYear());
  if (isDateToToday && isDateFromBeginningOfYear) return "btn1";
  else if (isDateToToday && diffDays === fixedRanges.month) return "btn2";
  else if (isDateToToday && diffDays === fixedRanges.day) return "btn3";
  else return "";
});

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
@use "@/sass/variables.scss";

$lightpadding: 1rem;
$filter-margin: 2em;

main#search {
  padding-left: $lightpadding;
  padding-right: $lightpadding;
}

#searchContainer {
  display: flex;
  justify-content: center;
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

@media screen and (max-width: variables.$narrow-screen) {
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

#reset {
  cursor: pointer;
  text-decoration: underline;
  color: #bcd2e2;
  margin-top: 1rem;
  display: block;
}

.results {
  display: inline-flex;
  flex-grow: 1;
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
    border: 1px solid variables.$steel-warrior;
    border-radius: 3px;
    background-color: variables.$blue-dust;
    flex-grow: 1;
    text-align: center;

    &:hover {
      background-color: variables.$steel-warrior;
    }

    &:focus {
      outline: thin dotted;
    }

    &:active {
      outline: none;
    }
  }

  .activeBtn {
    background-color: variables.$steel-warrior;
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
    background-color: variables.$steel-warrior;
  }
}

span.centerlabel {
  line-height: 30px;
  font-size: 80%;
}

.widemapmarginleft {
  margin-top: -20px;
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
</style>
