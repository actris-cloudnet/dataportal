<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'Synergetic (pass)',
      'all-raw': 'Synergetic (warnings / info)',
      'contains-errors': 'Synergetic (errors)',
      'only-legacy-data': 'Legacy',
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
          <ul v-for="prodType in allProdTypes" :key="prodType">
            <li class="header">{{ toolTipTitle(prodType) }}</li>
            <li
              v-for="product in findProducts(props, prodType)"
              :key="product.id"
              class="qualityitem"
              :class="{
                found: data && getProductStatus(data.products[prodType], product.id),
                na: !data || !getReportExists(data.products[prodType], product.id),
                info: data && isFileWithInfo(data.products[prodType], product.id),
                warning: data && isFileWithWarning(data.products[prodType], product.id),
                error: data && isFileWithError(data.products[prodType], product.id),
              }"
            >
              {{ product.humanReadableName }}
              <sup class="legacy-label" v-if="data && isLegacyFile(data.products[prodType], product.id)">L</sup>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import { type ColorClass, classColor } from "@/lib";
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
  allSynergeticPass,
  hasSomeSynergeticTests,
  synergeticContainsErrors,
  synergeticContainsWarningsOrInfo,
  onlyLegacySynergetic,
  findProducts,
  toolTipTitle,
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

const allProdTypes = computed(() => Array.from(new Set(Object.values(props.dataStatus.lvlTranslate))).sort());

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (hasSomeSynergeticTests(products) && onlyLegacySynergetic(products)) return "only-legacy-data";
  if (allSynergeticPass(products, props.dataStatus.synergeticProductCount)) return "all-data";
  if (synergeticContainsErrors(products)) return "contains-errors";
  if (synergeticContainsWarningsOrInfo(products)) return "all-raw";
  return "only-model-data";
}
</script>

<style src="@/sass/tooltip.scss" />
