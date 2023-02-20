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

.dataviz-tooltip
  position: fixed
  z-index: 10
  background: white
  padding-top: 0.1em
  padding-left: 0.2em
  padding-right: 0.2em
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2)

  img
    height: 1em
    margin-top: -4px
</style>

<template>
  <!-- eslint-disable vue/require-v-for-key -->
  <div id="data_availability_visualization" v-if="!busy">
    <div
      v-for="(year, index) in yearsReduced"
      :key="year.year"
      class="dataviz-row"
    >
      <div
        v-if="
          index &&
          parseInt(year.year) + 1 !== parseInt(yearsReduced[index - 1]['year'])
        "
        class="dataviz-skippedyears"
      >
        <template
          v-if="
            parseInt(year.year) - parseInt(dataStatus.years[index - 1].year) ==
            -2
          "
        >
          No data for year {{ parseInt(year.year) + 1 }}.
        </template>
        <template v-else>
          No data for years {{ parseInt(year.year) + 1 }} -
          {{ parseInt(dataStatus.years[index - 1].year) - 1 }}.
        </template>
      </div>
      <div class="dataviz-year">{{ year.year }}</div>
      <div class="dataviz-yearblock" @mouseleave="debouncedHideTooltip()">
        <a
          v-for="date in year.dates"
          :key="date.date"
          class="dataviz-date"
          :id="`dataviz-color-${year.year}-${date.date}`"
          :href="createLinkToLandingPage(date.products)"
          :class="createColorClassForSingleProduct(date.products)"
          @mouseenter="debouncedSetCurrentYearDate(year, date, $event)"
        >
        </a>
      </div>
    </div>
    <div></div>

    <div class="dav-legend" v-if="legend && qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        Pass
      </div>
      <div class="legendexpl">
        <div class="contains-info legendcolor"></div>
        Info
      </div>
      <div class="legendexpl">
        <div class="contains-warnings legendcolor"></div>
        Warning
      </div>
      <div class="legendexpl">
        <div class="contains-errors legendcolor"></div>
        Error
      </div>
      <div class="legendexpl">
        <div class="only-legacy-data legendcolor"></div>
        Legacy
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        Missing QC report
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <br />
    </div>
    <div
      class="dataviz-tooltip"
      v-if="tooltips && hover && currentDate && currentYear"
      :style="tooltipStyle"
    >
      <header>
        <img :src="createIconForSingleProduct(currentDate.products)" alt="" />
        {{ currentYear.year }}-{{ currentDate.date }}
      </header>
    </div>
  </div>
  <div v-else class="loadingoverlay">
    <div class="lds-dual-ring"></div>
  </div>
</template>

<script lang="ts" setup>
import type {
  ProductLevels,
  ProductYear,
  ProductDate,
  ProductInfo,
  DataStatus,
} from "../lib/DataStatusParser";
import type { ColorClass } from "../lib";
import debounce from "debounce";
import { computed, ref } from "vue";

import testPassIcon from "../assets/icons/test-pass.svg";
import testWarningIcon from "../assets/icons/test-warning.svg";
import testFailIcon from "../assets/icons/test-fail.svg";
import testInfoIcon from "../assets/icons/test-info.svg";
import legacyPassIcon from "../assets/icons/legacy-pass.svg";
import testMissingIcon from "../assets/icons/test-missing.svg";

export interface Props {
  site: string;
  legend: boolean;
  dateFrom?: string;
  tooltips?: boolean;
  qualityScores?: boolean;
  product: string;
  dataStatus: DataStatus;
}

const props = defineProps<Props>();

const busy = false;
const currentYear = ref<ProductYear | null>(null);
const currentDate = ref<ProductDate | null>(null);
const hover = ref(false);
const tooltipStyle = ref<Record<string, string>>({});

const yearsReduced = computed(() =>
  props.dataStatus.years.map((year) => ({
    year: year.year,
    dates: year.dates.map((date) => ({
      date: date.date,
      products: {
        "2": date.products["2"].filter((x) => x.id == props.product),
        "1b": date.products["1b"].filter((x) => x.id == props.product),
        "1c": date.products["1c"].filter((x) => x.id == props.product),
      },
    })),
  }))
);

function createLinkToLandingPage(products: ProductLevels): string | undefined {
  const prodsAll = products["2"].concat(products["1b"], products["1c"]);
  if (prodsAll.length > 0) {
    const uuid = prodsAll[0].uuid;
    return `/file/${uuid}`;
  }
}

function qualityExists(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel !== null;
}

function hasSomeTests(products: ProductLevels) {
  return (
    products["2"].filter(qualityExists).length > 0 ||
    products["1c"].filter(qualityExists).length > 0 ||
    products["1b"].filter(qualityExists).length > 0
  );
}

function isError(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "error";
}

function anyProductContainsErrors(products: ProductLevels) {
  return (
    products["2"].filter(isError).length > 0 ||
    products["1c"].filter(isError).length > 0 ||
    products["1b"].filter(isError).length > 0
  );
}

function isWarning(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "warning";
}

function anyProductContainsWarnings(products: ProductLevels) {
  return (
    products["2"].filter(isWarning).length > 0 ||
    products["1c"].filter(isWarning).length > 0 ||
    products["1b"].filter(isWarning).length > 0
  );
}

function isInfo(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "info";
}

function anyProductContainsInfo(products: ProductLevels) {
  return (
    products["2"].filter(isInfo).length > 0 ||
    products["1c"].filter(isInfo).length > 0 ||
    products["1b"].filter(isInfo).length > 0
  );
}

function topQuality(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "pass";
}

function allPass(products: ProductLevels) {
  return (
    products["2"].filter(topQuality).length == products["2"].length &&
    products["1c"].filter(topQuality).length == products["1c"].length &&
    products["1b"].filter(topQuality).length == products["1b"].length
  );
}

function isLegacy(prod: ProductInfo): boolean {
  return prod.legacy;
}

function noData(products: ProductLevels): boolean {
  return (
    products["2"].length == 0 &&
    products["1c"].length == 0 &&
    products["1b"].length == 0
  );
}

function isLegacyOrModel(prod: ProductInfo): boolean {
  return prod.legacy || prod.id == "model";
}

function onlyLegacy(products: ProductLevels) {
  return (
    products["2"].every(isLegacy) &&
    products["1c"].every(isLegacy) &&
    products["1b"].every(isLegacyOrModel)
  );
}

function createColorClassForSingleProduct(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (props.qualityScores) {
    if (hasSomeTests(products) && onlyLegacy(products))
      return "only-legacy-data";
    if (allPass(products)) return "all-data";
    if (anyProductContainsErrors(products)) return "contains-errors";
    if (anyProductContainsWarnings(products)) return "contains-warnings";
    if (anyProductContainsInfo(products)) return "contains-info";
    return "only-model-data";
  }
  if (onlyLegacy(products)) return "only-legacy-data";
  return "all-data";
}

function createIconForSingleProduct(products: ProductLevels): string {
  switch (createColorClassForSingleProduct(products)) {
    case "all-data":
      return testPassIcon;
    case "contains-warnings":
      return testWarningIcon;
    case "contains-errors":
      return testFailIcon;
    case "contains-info":
      return testInfoIcon;
    case "only-legacy-data":
      return legacyPassIcon;
    default:
      return testMissingIcon;
  }
}

function hideTooltip() {
  hover.value = false;
}

function setCurrentYearDate(
  year: ProductYear,
  date: ProductDate,
  event: MouseEvent
) {
  const tooltipTop =
    (event.target as HTMLElement).getBoundingClientRect().top - 30;
  const tooltipLeft = event.clientX;
  tooltipStyle.value = {
    top: `${tooltipTop}px`,
    left: `${tooltipLeft}px`,
    transform: "translateX(-50%)",
  };
  currentDate.value = date;
  currentYear.value = year;
  hover.value = true;
}

const debounceMs = 1000 / 60;
const debouncedSetCurrentYearDate = debounce(setCurrentYearDate, debounceMs);
const debouncedHideTooltip = debounce(hideTooltip, debounceMs);
</script>
