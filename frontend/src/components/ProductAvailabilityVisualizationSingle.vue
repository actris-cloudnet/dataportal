<template>
  <DateVisualization
    :data="dates"
    :legend="{
      'all-data': 'Pass',
      'contains-info': 'Info',
      'contains-warnings': 'Warning',
      'contains-errors': 'Error',
      'only-legacy-data': 'Legacy',
      'only-model-data': 'Missing QC report',
      'no-data': 'No data',
    }"
    :colors="classColor"
    :year="year"
  >
    <template #tooltip="{ date, data }">
      <div class="dataviz-tooltip" v-if="isSingle">
        <img class="tooltip-icon" :src="data?.products[0] ? createIcon(data.products[0]) : testMissingIcon" alt="" />
        <div class="tooltip-date">{{ date }}</div>
        <div class="tooltip-site" v-if="sites">{{ data?.products[0] ? getSite(data.products[0]) : "No products" }}</div>
      </div>
      <div class="dataviz-tooltip" v-else>
        <div class="tooltip-date">{{ date }}</div>
        <ul class="tooltip-products">
          <li class="tooltip-product" v-for="instrument in dataStatus.allPids[props.productId]" :key="instrument.pid">
            <img class="tooltip-icon" :src="data ? findIcon(data.products, instrument.pid) : testMissingIcon" alt="" />
            {{ instrument.name }}
          </li>
        </ul>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import type { ProductDate, ProductInfo } from "@/lib/DataStatusParser";
import { classColor, type ColorClass } from "@/lib";
import DateVisualization from "./DateVisualization.vue";
import { isLegacy, isError, isWarning, isInfo, isPass, qualityExists } from "@/lib/ProductAvailabilityTools";
import { computed } from "vue";
import type { DataStatus } from "@/lib/DataStatusParser";
import type { Site } from "@shared/entity/Site";

import testPassIcon from "@/assets/icons/test-pass.svg";
import testWarningIcon from "@/assets/icons/test-warning.svg";
import testFailIcon from "@/assets/icons/test-fail.svg";
import testInfoIcon from "@/assets/icons/test-info.svg";
import legacyPassIcon from "@/assets/icons/legacy-pass.svg";
import testMissingIcon from "@/assets/icons/test-missing.svg";
import { useRouter } from "vue-router";

interface Props {
  dataStatus: DataStatus;
  productId: string;
  year?: number;
  instrumentPid?: string;
  modelId?: string;
  sites?: Site[];
}

const props = defineProps<Props>();
const router = useRouter();

const isSingle = computed(
  () =>
    props.instrumentPid ||
    props.modelId ||
    props.sites ||
    !props.dataStatus.allPids[props.productId] ||
    props.dataStatus.allPids[props.productId].length === 1,
);

const dates = computed(() =>
  props.dataStatus.dates.map((date) => {
    const allProducts = isSingle.value
      ? [getProduct(date, props.productId, props.instrumentPid, props.modelId)]
      : props.dataStatus.allPids[props.productId].map((instrument) =>
          getProduct(date, props.productId, instrument.pid),
        );
    const validProducts = allProducts.filter((product) => !!product);
    return {
      date: date.date,
      color: createColor(validProducts),
      link: createLink(date.date, validProducts),
      products: validProducts,
    };
  }),
);

const getProduct = (date: ProductDate, productId: string, instrumentPid?: string, modelId?: string) => {
  if (modelId) {
    return date.products.instrument.find((p) => p.modelId === modelId);
  }
  if (instrumentPid) {
    return date.products.instrument.find((p) => p.instrumentPid === instrumentPid && p.id === productId);
  }
  return (
    date.products.instrument.find((p) => p.id == productId) || date.products.geophysical.find((p) => p.id == productId)
  );
};

function getSite(product: ProductInfo) {
  if (!props.sites) return undefined;
  const site = props.sites.find((site) => site.id === product.siteId);
  if (!site) return product.siteId;
  return site.humanReadableName;
}

function createLink(date: string, products: ProductInfo[]) {
  if (products.length === 0) return;
  if (products.length === 1) {
    return router.resolve({
      name: "File",
      params: { uuid: products[0].uuid },
    }).href;
  }
  return router.resolve({
    name: "Search",
    params: { mode: "data" },
    query: {
      site: [...new Set(products.map((product) => product.siteId))],
      product: props.productId,
      dateFrom: date,
      dateTo: date,
    },
  }).href;
}

function createColor(products: ProductInfo[]): ColorClass {
  if (products.length === 0) return "no-data";
  if (products.every(isPass)) return "all-data";
  if (products.every((product) => qualityExists(product) && isLegacy(product))) return "only-legacy-data";
  if (products.some(isError)) return "contains-errors";
  if (products.some(isWarning)) return "contains-warnings";
  if (products.some(isInfo)) return "contains-info";
  return "only-model-data";
}

function createIcon(product: ProductInfo): string {
  if (qualityExists(product) && isLegacy(product)) return legacyPassIcon;
  if (isError(product)) return testFailIcon;
  if (isWarning(product)) return testWarningIcon;
  if (isInfo(product)) return testInfoIcon;
  if (isPass(product)) return testPassIcon;
  return testMissingIcon;
}

function findIcon(products: ProductInfo[], instrumentPid: string) {
  const product = products.find((product) => product.instrumentPid == instrumentPid);
  return product ? createIcon(product) : testMissingIcon;
}
</script>

<style scoped lang="scss">
.dataviz-tooltip {
  background: white;
  padding: 0.2em 0.4em;
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  column-gap: 2px;
}

.tooltip-icon {
  display: block;
  height: 1em;
}

.tooltip-site {
  font-size: 0.8rem;
  color: #333;
  grid-column: 2;
}

.tooltip-products {
  grid-row: 2;
  font-size: 0.8rem;
}

.tooltip-product {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
