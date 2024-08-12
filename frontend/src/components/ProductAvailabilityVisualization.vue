<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'All geophysical products',
      'all-raw': 'Some instrument products',
      'only-legacy-data': 'Only legacy',
      'only-model-data': 'Only model',
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
              class="productitem"
              :class="{ found: data && getProductStatus(data.products[prodType], product.id) }"
            >
              {{ product.humanReadableName }}
              <sup
                class="legacy-label"
                v-if="prodType === 'geophysical' && data && isLegacyFile(data.products[prodType], product.id)"
                >L</sup
              >
            </li>
          </ul>
        </section>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import { classColor, type ColorClass } from "@/lib";
import type { ProductLevels, ProductType } from "@/lib/DataStatusParser";
import { computed } from "vue";

import {
  isLegacyFile,
  noData,
  onlyModel,
  allGeophysical,
  getProductStatus,
  missingData,
  onlyLegacy,
  findProducts,
  toolTipTitle,
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

const allProdTypes: ProductType[] = ["instrument", "geophysical"];

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  if (onlyModel(products)) return "only-model-data";
  if (onlyLegacy(products)) return "only-legacy-data";
  if (allGeophysical(products, props.dataStatus.geophysicalProductCount)) return "all-data";
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
