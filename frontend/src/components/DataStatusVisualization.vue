<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/spinner.sass"
@import "../sass/availability.sass"

.dataviz-date
  width: calc(1%/3.66)
  height: 1em
  display: inline-block
  position: relative
  border-top: 1px solid gray
  border-bottom: 1px solid gray
  cursor: default

.dataviz-date[href]
  cursor: pointer

.legacy-label
  color: grey

.dataviz-tooltip
  position: fixed
  z-index: 6
  background: white
  padding: .75em 1em
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2)
  border-radius: 8px

  section
    display: flex
    justify-content: space-between
    font-size: 0.9em
    margin-top: .5em

    ul
      padding: 0
      list-style: none
      white-space: pre-wrap
      margin-bottom: 0

      li.header
        font-weight: bold

      li.modelitem
        margin-top: 0.8em

      // Product availability:

      li.productitem::before
        content: '    '
        background-repeat: no-repeat
        background-position: center
        background-size: contain

      li.productitem.found::before
        background-image: url('../assets/icons/test-pass.svg')

      li.productitem:not(.found)::before
        background-image: url('../assets/icons/test-missing.svg')

      // Quality:

      li.qualityitem::before
        content: '    '
        background-repeat: no-repeat
        background-position: center
        background-size: contain

      li.qualityitem:not(.found).na::before
        background-image: url('../assets/icons/test-missing.svg')

      li.qualityitem:not(.found)::before
        background-image: url('../assets/icons/test-fail.svg')

      li.qualityitem.found::before
        background-image: url('../assets/icons/test-pass.svg')

      li.qualityitem.info::before
        background-image: url('../assets/icons/test-info.svg')

      li.qualityitem.warning::before
        background-image: url('../assets/icons/test-warning.svg')

      li.qualityitem.error::before
        background-image: url('../assets/icons/test-fail.svg')


.dataviz-date:hover .dataviz-tooltip
  display: block
</style>

<template>
  <!-- eslint-disable vue/require-v-for-key -->
  <div id="data_availability_visualization" v-if="!busy">
    <div
      v-for="(year, index) in dataStatus.years"
      :key="year['year']"
      class="dataviz-row"
    >
      <div
        v-if="
          index &&
          parseInt(year['year']) + 1 !==
            parseInt(dataStatus.years[index - 1]['year'])
        "
        class="dataviz-skippedyears"
      >
        <template
          v-if="
            parseInt(year['year']) -
              parseInt(dataStatus.years[index - 1]['year']) ==
            -2
          "
        >
          No data for year {{ parseInt(year["year"]) + 1 }}.
        </template>
        <template v-else>
          No data for years {{ parseInt(year["year"]) + 1 }} -
          {{ parseInt(dataStatus.years[index - 1]["year"]) - 1 }}.
        </template>
      </div>
      <div class="dataviz-year">{{ year["year"] }}</div>
      <div class="dataviz-yearblock" @mouseleave="debouncedHideTooltip()">
        <a
          v-for="date in year.dates"
          class="dataviz-date"
          :id="`dataviz-color-${year.year}-${date.date}`"
          :class="createColorClass(date.products)"
          :href="
            createLinkToSearchPage(`${year.year}-${date.date}`, date.products)
          "
          @mouseenter="debouncedSetCurrentYearDate(year, date, $event)"
        ></a>
      </div>
    </div>
    <div></div>
    <div class="dav-legend" v-if="legend && !qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        All level 2
      </div>
      <div class="legendexpl">
        <div class="all-raw legendcolor"></div>
        Some level 1b
      </div>
      <div class="legendexpl">
        <div class="only-legacy-data legendcolor"></div>
        Only legacy
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        Only model
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <br />
      <div class="legendexpl">
        <span class="legacy-label"><sup>L</sup></span> Legacy
      </div>
    </div>
    <div class="dav-legend" v-if="legend && qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        L2 pass
      </div>
      <div class="legendexpl">
        <div class="all-raw legendcolor"></div>
        L2 warnings
      </div>
      <div class="legendexpl">
        <div class="contains-errors legendcolor"></div>
        L2 errors
      </div>
      <div class="legendexpl">
        <div class="only-legacy-data legendcolor"></div>
        Legacy L2
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        Products / tests missing
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <br />
      <div class="legendexpl">
        <span class="legacy-label"><sup>L</sup></span> Legacy
      </div>
    </div>
    <div
      class="dataviz-tooltip"
      v-if="tooltips && hover && currentYear && currentDate"
      :style="tooltipStyle"
    >
      <header>{{ currentYear.year }}-{{ currentDate.date }}</header>
      <section v-if="!qualityScores">
        <ul v-for="lvl in allLevels">
          <li class="header">Level {{ lvl }}</li>
          <li
            v-for="product in filterProductsByLvl(lvl)"
            class="productitem"
            :class="{
              found: getProductStatus(currentDate.products[lvl], product.id),
            }"
            :key="product.id"
          >
            {{ idToHumanReadable(product.id) }}
            <sup
              class="legacy-label"
              v-if="isLegacyFile(currentDate.products[lvl], product.id)"
              >L</sup
            >
          </li>
          <li
            v-if="lvl === '1b'"
            class="productitem modelitem"
            :class="{
              found: getProductStatus(currentDate.products[lvl], 'model'),
              na:
                qualityScores &&
                !getReportExists(currentDate.products[lvl], 'model'),
            }"
          >
            Model
          </li>
        </ul>
      </section>

      <section v-else>
        <ul v-for="lvl in allLevels">
          <li class="header">Level {{ lvl }}</li>
          <li
            v-for="product in filterProductsByLvl(lvl)"
            class="qualityitem"
            :class="{
              found: getProductStatus(currentDate.products[lvl], product.id),
              na:
                qualityScores &&
                !getReportExists(currentDate.products[lvl], product.id),
              info: isFileWithInfo(currentDate.products[lvl], product.id),
              warning: isFileWithWarning(currentDate.products[lvl], product.id),
              error: isFileWithError(currentDate.products[lvl], product.id),
            }"
            :key="product.id"
          >
            {{ idToHumanReadable(product.id) }}
            <sup
              class="legacy-label"
              v-if="isLegacyFile(currentDate.products[lvl], product.id)"
              >L</sup
            >
          </li>
          <li
            v-if="lvl === '1b'"
            class="qualityitem modelitem"
            :class="{
              found: getProductStatus(currentDate.products[lvl], 'model'),
              na:
                qualityScores &&
                !getReportExists(currentDate.products[lvl], 'model'),
            }"
          >
            Model
          </li>
        </ul>
      </section>
    </div>
  </div>
  <div v-else class="loadingoverlay">
    <div class="lds-dual-ring"></div>
  </div>
</template>

<script lang="ts" setup>
import { idToHumanReadable, type ColorClass } from "../lib";
import type { Product } from "@shared/entity/Product";
import type {
  DataStatus,
  ProductDate,
  ProductInfo,
  ProductLevels,
  ProductYear,
} from "../lib/DataStatusParser";
import debounce from "debounce";
import { onMounted, ref, computed } from "vue";

export interface Props {
  site: string;
  loadingComplete?: () => void;
  legend: boolean;
  dateFrom?: string;
  tooltips?: boolean;
  qualityScores?: boolean;
  dataStatus: DataStatus;
}

const props = defineProps<Props>();

const busy = ref(false);
const currentYear = ref<ProductYear | null>(null);
const currentDate = ref<ProductDate | null>(null);
const hover = ref(false);
const tooltipStyle = ref<Record<string, string>>({});

onMounted(() => {
  if (props.loadingComplete) props.loadingComplete();
});

function setCurrentYearDate(
  year: ProductYear,
  date: ProductDate,
  event: MouseEvent
) {
  const tooltipWidth = 420;
  const tooltipMargin = 10;
  tooltipStyle.value = {
    width: tooltipWidth + "px",
    top: event.clientY + 10 + "px",
    left:
      Math.min(
        Math.max(tooltipMargin, event.clientX - tooltipWidth / 2),
        document.body.scrollWidth - tooltipWidth - tooltipMargin
      ) + "px",
  };
  currentDate.value = date;
  currentYear.value = year;
  hover.value = true;
}

function hideTooltip() {
  hover.value = false;
}

const debounceMs = 1000 / 60;
const debouncedSetCurrentYearDate = debounce(setCurrentYearDate, debounceMs);
const debouncedHideTooltip = debounce(hideTooltip, debounceMs);

function noData(products: ProductLevels): boolean {
  return (
    products["2"].length == 0 &&
    products["1c"].length == 0 &&
    products["1b"].length == 0
  );
}

function isLegacy(prod: ProductInfo): boolean {
  return prod.legacy;
}

function isLegacyOrModel(prod: ProductInfo): boolean {
  return prod.legacy || prod.id == "model";
}

function isNotLegacy(prod: ProductInfo): boolean {
  return !isLegacy(prod);
}

function topQuality(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "pass";
}

function isError(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "error";
}

function isWarning(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "warning";
}

function isInfo(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "info";
}

function qualityExists(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel !== null;
}

function filterProductsByLvl(lvl: string) {
  if (!props.dataStatus.allProducts) return null;
  return props.dataStatus.allProducts.filter(
    ({ id }) => props.dataStatus.lvlTranslate[id] == lvl && id != "model"
  );
}

function onlyLegacy(products: ProductLevels) {
  return (
    products["2"].every(isLegacy) &&
    products["1c"].every(isLegacy) &&
    products["1b"].every(isLegacyOrModel)
  );
}

function onlyLegacyLevel2(products: ProductLevels) {
  return products["2"].length > 0 && products["2"].every(isLegacy);
}

function onlyModel(products: ProductLevels) {
  return (
    products["2"].length == 0 &&
    products["1c"].length == 0 &&
    products["1b"].length == 1 &&
    products["1b"][0].id == "model"
  );
}

function getProductStatus(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (props.qualityScores && existingProduct) {
    return topQuality(existingProduct);
  }
  return existingProduct;
}

function isLegacyFile(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return existingProduct.legacy;
  }
}

function isFileWithWarning(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isWarning(existingProduct);
  }
}

function isFileWithInfo(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isInfo(existingProduct);
  }
}

function isFileWithError(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isError(existingProduct);
  }
}

function getReportExists(
  existingProducts: ProductInfo[],
  productId: Product["id"]
) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  return existingProduct && qualityExists(existingProduct);
}

const allLevels = computed(() => {
  return Array.from(
    new Set(Object.values(props.dataStatus.lvlTranslate))
  ).sort();
});

function hasSomeLevel2Tests(products: ProductLevels) {
  return products["2"].filter(qualityExists).length > 0;
}

function level2ContainsErrors(products: ProductLevels) {
  return products["2"].filter(isError).length > 0;
}

function level2containsWarnings(products: ProductLevels) {
  return products["2"].filter(isWarning).length > 0;
}

function allLevel2Pass(products: ProductLevels): boolean {
  return products["2"].filter(topQuality).length == 4;
}

function allLvl2(products: ProductLevels): boolean {
  return products["2"].filter(isNotLegacy).length == 4;
}

function missingData(products: ProductLevels) {
  return (
    products["2"].filter(isNotLegacy).length ||
    products["1c"].filter(isNotLegacy).length ||
    products["1b"].filter(isNotLegacy).length
  );
}

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (props.qualityScores) {
    if (hasSomeLevel2Tests(products) && onlyLegacyLevel2(products))
      return "only-legacy-data";
    if (allLevel2Pass(products)) return "all-data";
    if (level2ContainsErrors(products)) return "contains-errors";
    if (level2containsWarnings(products)) return "all-raw";
    return "only-model-data";
  }
  if (onlyModel(products)) return "only-model-data";
  if (onlyLegacy(products)) return "only-legacy-data";
  if (allLvl2(products)) return "all-data";
  if (missingData(products)) return "all-raw";
  return "contains-errors";
}

function createLinkToSearchPage(
  date: string,
  products: ProductLevels
): string | undefined {
  if (!props.qualityScores && !noData(products)) {
    return `/search/data?site=${props.site}&dateFrom=${date}&dateTo=${date}`;
  }
}
</script>
