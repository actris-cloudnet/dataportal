<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'Data available',
      'no-data': 'No data',
    }"
    :colors="classColor"
  >
    <template #tooltip="{ date, data }">
      <div class="mega-tooltip" style="width: 280px">
        <header>{{ date }}</header>
        <section>
          <ul>
            <li
              v-for="product in dataStatus.availableProducts"
              :key="product.id"
              class="productitem"
              :class="{
                found: data && getProductStatus(data.products, product.id),
              }"
            >
              {{ product.humanReadableName }}
            </li>
          </ul>
        </section>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import { classColor, type ColorClass } from "@/lib";
import type { DataStatus, ProductInfo, ProductLevels } from "@/lib/DataStatusParser";
import { computed } from "vue";

import { noData } from "@/lib/ProductAvailabilityTools";
import { useRouter } from "vue-router";
import DateVisualization from "./DateVisualization.vue";

export interface Props {
  dataStatus: DataStatus;
}

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

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) return "no-data";
  return "all-data";
}

function getProductStatus(products: ProductLevels, productId: string): boolean {
  const isProduct = (p: ProductInfo) => p.id === productId;
  return products["1b"].some(isProduct) || products["1c"].some(isProduct) || products["2"].some(isProduct);
}

function createLinkToSearchPage(date: string, products: ProductLevels): string | undefined {
  if (noData(products)) return;
  const allProducts = [...products["1b"], ...products["1c"], ...products["2"]];
  const to =
    allProducts.length === 1
      ? { name: "File", params: { uuid: allProducts[0].uuid } }
      : {
          name: "Search",
          params: { mode: "data" },
          query: {
            site: [...new Set(allProducts.map((product) => product.siteId))].join(","),
            product: allProducts.map((product) => product.id).join(","),
            instrumentPid: allProducts[0].instrumentPid,
            dateFrom: date,
            dateTo: date,
          },
        };
  return router.resolve(to).href;
}
</script>

<style src="@/sass/tooltip.scss" />
