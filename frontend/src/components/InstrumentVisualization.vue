<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'All products',
      'all-raw': 'Some products',
      'no-data': 'No products',
    }"
    :colors="classColor"
  >
    <template #tooltip="{ date, data }">
      <div class="mega-tooltip" style="width: 280px">
        <header>
          <span class="header-date">{{ date }}</span>
          <span class="header-site" v-if="data">{{ getSites(data.products).join(", ") }}</span>
        </header>
        <section>
          <ul>
            <li
              v-for="product in dataStatus.availableProducts"
              :key="product.id"
              class="qualityitem"
              :class="{
                na: !data || !hasProduct(data.products, product.id),
                error: data && isFileWithError(data.products.instrument.concat(data.products.geophysical), product.id),
                warning:
                  data && isFileWithWarning(data.products.instrument.concat(data.products.geophysical), product.id),
                info: data && isFileWithInfo(data.products.instrument.concat(data.products.geophysical), product.id),
                found: data && isFileWithPass(data.products.instrument.concat(data.products.geophysical), product.id),
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

import {
  noData,
  isFileWithError,
  isFileWithInfo,
  isFileWithWarning,
  isFileWithPass,
} from "@/lib/ProductAvailabilityTools";
import { useRouter } from "vue-router";
import DateVisualization from "./DateVisualization.vue";
import type { Site } from "@shared/entity/Site";

export interface Props {
  dataStatus: DataStatus;
  sites: Site[];
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

function getSites(product: ProductLevels) {
  const siteIds = new Set([
    ...product.geophysical.map((product) => product.siteId),
    ...product.instrument.map((product) => product.siteId),
  ]);
  return [...siteIds].map((siteId) => {
    const site = props.sites.find((site) => site.id === siteId);
    if (!site) return siteId;
    return site.humanReadableName;
  });
}

function createColorClass(products: ProductLevels): ColorClass {
  if (noData(products)) {
    return "no-data";
  }
  const productCount = products.instrument.length + products.geophysical.length;
  if (productCount === props.dataStatus.availableProducts.length) {
    return "all-data";
  }
  return "all-raw";
}

function hasProduct(products: ProductLevels, productId: string): boolean {
  const isProduct = (p: ProductInfo) => p.id === productId;
  return products.instrument.some(isProduct) || products.geophysical.some(isProduct);
}

function createLinkToSearchPage(date: string, products: ProductLevels): string | undefined {
  if (noData(products)) return;
  const allProducts = [...products.instrument, ...products.geophysical];
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

<style scoped lang="scss">
header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-site {
  margin-left: auto;
  font-size: 0.8rem;
  color: #333;
}
</style>
