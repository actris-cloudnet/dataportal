<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'All level 2',
      'all-raw': 'Some level 1b',
      'only-legacy-data': 'Only legacy',
      'only-model-data': 'Only model',
      'no-data': 'No data',
    }"
    :colors="classColor"
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
              class="productitem"
              :class="{
                found: data && getProductStatus(data.products[lvl], product.id),
              }"
            >
              {{ idToHumanReadable(product.id) }}
              <sup class="legacy-label" v-if="data && isLegacyFile(data.products[lvl], product.id)">L</sup>
            </li>
            <li
              v-if="lvl === '1b'"
              class="productitem modelitem"
              :class="{
                found: data && getProductStatus(data.products[lvl], 'model'),
                na: data && !getReportExists(data.products[lvl], 'model'),
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
import { idToHumanReadable, classColor, type ColorClass } from "@/lib";
import type { ProductLevels } from "@/lib/DataStatusParser";
import { computed } from "vue";

import {
  isLegacyFile,
  noData,
  onlyModel,
  allLvl2,
  getProductStatus,
  getReportExists,
  missingData,
  onlyLegacy,
  filterProductsByLvl,
  type Props,
} from "@/lib/ProductAvailabilityTools";
import { useRouter } from "vue-router";
import DateVisualization from "./DateVisualization.vue";

const props = defineProps<Props>();
const router = useRouter();
const dates = computed(() =>
  props.dataStatus.dates.map((date) => ({
    date: date.date,
    color: createColorClass(date.products),
    link: createLinkToSearchPage(date.date, date.products),
    products: date.products,
  })),
);

const allLevels = computed(() => Array.from(new Set(Object.values(props.dataStatus.lvlTranslate))).sort());

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (onlyModel(products)) return "only-model-data";
  if (onlyLegacy(products)) return "only-legacy-data";
  if (allLvl2(products, props.dataStatus.l2ProductCount)) return "all-data";
  if (missingData(products)) return "all-raw";
  return "contains-errors";
}

function createLinkToSearchPage(date: string, products: ProductLevels): string | undefined {
  if (noData(products) || !props.siteId) return;
  return router.resolve({
    name: "Search",
    params: { mode: "data" },
    query: { site: props.siteId, dateFrom: date, dateTo: date },
  }).href;
}
</script>

<style src="@/sass/tooltip.scss" />
