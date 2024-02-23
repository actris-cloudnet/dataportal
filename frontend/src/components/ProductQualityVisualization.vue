<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'L2 pass',
      'all-raw': 'L2 warnings / info',
      'contains-errors': 'L2 errors',
      'only-legacy-data': 'Legacy L2',
      'only-model-data': 'Products / tests missing',
      'no-data': 'No data',
    }"
    :colors="classColor"
    :year="year"
  >
    <template #tooltip="{ date, data }">
      <div class="mega-tooltip">
        <header>{{ date }}</header>
        <section>
          <ul v-for="lvl in allLevels" :key="lvl">
            <li class="header">Level {{ lvl }}</li>
            <li
              v-for="product in filterProductsByLvl(props, lvl)"
              :key="product.id"
              class="qualityitem"
              :class="{
                found: data && getProductStatus(data.products[lvl], product.id),
                na: !data || !getReportExists(data.products[lvl], product.id),
                info: data && isFileWithInfo(data.products[lvl], product.id),
                warning: data && isFileWithWarning(data.products[lvl], product.id),
                error: data && isFileWithError(data.products[lvl], product.id),
              }"
            >
              {{ idToHumanReadable(product.id) }}
              <sup class="legacy-label" v-if="data && isLegacyFile(data.products[lvl], product.id)">L</sup>
            </li>
            <li
              v-if="lvl === '1b'"
              class="qualityitem modelitem"
              :class="{
                found: data && getProductStatus(data.products[lvl], 'model'),
                na: !data || !getReportExists(data.products[lvl], 'model'),
              }"
            >
              Model
            </li>
          </ul>
        </section>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import { idToHumanReadable, type ColorClass, classColor } from "@/lib";
import type { ProductLevels } from "@/lib/DataStatusParser";
import { computed } from "vue";

import {
  isLegacyFile,
  noData,
  isFileWithInfo,
  isFileWithError,
  isFileWithWarning,
  getProductStatus,
  getReportExists,
  allLevel2Pass,
  hasSomeLevel2Tests,
  level2ContainsErrors,
  level2containsWarningsOrInfo,
  onlyLegacyLevel2,
  filterProductsByLvl,
  type Props,
} from "@/lib/ProductAvailabilityTools";
import DateVisualization from "./DateVisualization.vue";

const props = defineProps<Props>();
const dates = computed(() =>
  props.dataStatus.dates.map((date) => ({
    date: date.date,
    color: createColorClass(date.products),
    products: date.products,
  })),
);

const allLevels = computed(() => Array.from(new Set(Object.values(props.dataStatus.lvlTranslate))).sort());

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (hasSomeLevel2Tests(products) && onlyLegacyLevel2(products)) return "only-legacy-data";
  if (allLevel2Pass(products, props.dataStatus.l2ProductCount)) return "all-data";
  if (level2ContainsErrors(products)) return "contains-errors";
  if (level2containsWarningsOrInfo(products)) return "all-raw";
  return "only-model-data";
}
</script>

<style src="@/sass/tooltip.scss" />
