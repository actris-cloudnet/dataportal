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
      <div class="dataviz-tooltip">
        <img :src="data ? createIcon(data.product) : testMissingIcon" alt="" />
        {{ date }}
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import type { ProductDate, ProductInfo } from "@/lib/DataStatusParser";
import { classColor, type ColorClass } from "@/lib";
import DateVisualization from "./DateVisualization.vue";
import { isLegacy, isError, isWarning, isInfo, qualityExists, isPass } from "@/lib/ProductAvailabilityTools";
import { computed } from "vue";
import type { DataStatus } from "@/lib/DataStatusParser";

import testPassIcon from "@/assets/icons/test-pass.svg";
import testWarningIcon from "@/assets/icons/test-warning.svg";
import testFailIcon from "@/assets/icons/test-fail.svg";
import testInfoIcon from "@/assets/icons/test-info.svg";
import legacyPassIcon from "@/assets/icons/legacy-pass.svg";
import testMissingIcon from "@/assets/icons/test-missing.svg";

interface Props {
  dataStatus: DataStatus;
  productId: string;
  year?: number;
  instrumentPid?: string;
  modelId?: string;
}

const props = defineProps<Props>();

const dates = computed(() =>
  props.dataStatus.dates.map((date) => {
    const product = getProduct(date, props.productId, props.instrumentPid, props.modelId);
    return {
      date: date.date,
      color: createColor(product!),
      link: createLink(product!),
      product,
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

function createLink(product?: ProductInfo): string | undefined {
  if (product) {
    const uuid = product.uuid;
    return `/file/${uuid}`;
  }
}

function createColor(product?: ProductInfo): ColorClass {
  if (!product) return "no-data";
  if (qualityExists(product) && isLegacy(product)) return "only-legacy-data";
  if (isPass(product)) return "all-data";
  if (isError(product)) return "contains-errors";
  if (isWarning(product)) return "contains-warnings";
  if (isInfo(product)) return "contains-info";
  return "only-model-data";
}

function createIcon(product?: ProductInfo): string {
  switch (createColor(product)) {
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
</script>

<style scoped lang="scss">
.dataviz-tooltip {
  background: white;
  padding: 0.1em 0.2em;
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 2px;

  img {
    display: block;
    height: 1em;
  }
}
</style>
