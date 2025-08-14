<template>
  <div>
    <div class="filterbox">
      <SuperMap
        :key="mapKey"
        :sites="siteOptions"
        :selectedSiteIds="selectedSiteIds"
        :onMapMarkerClick="onMapMarkerClick"
        :center="[55, 12.0]"
        :zoom="3.5"
        enableBoundingBox
        class="map"
      />
      <CustomMultiselect
        label="Location"
        v-model="selectedSiteIds"
        :options="siteOptions"
        id="siteSelect"
        :multiple="true"
        :getIcon="getMarkerIcon"
      />
    </div>

    <div class="filterbox">
      <CustomMultiselect
        id="monitoring-product-select"
        label="Monitoring Product"
        v-model="selectedProductIds"
        :options="productOptions"
        :multiple="true"
      />
    </div>

    <div class="filterbox">
      <CustomMultiselect
        id="monitoring-variable-select"
        label="Monitoring Variable"
        v-model="selectedVariableIds"
        :options="variableOptions"
        :multiple="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import SuperMap from "@/components/SuperMap.vue";
import type { MonitoringProduct } from "@shared/entity/Monitoring";
import type { Site } from "@shared/entity/Site";
import { getMarkerIcon } from "@/lib";
const mapKey = ref(0); // Supermap does not update if the props update. This forces the update

const props = defineProps<{
  monitoringProducts: MonitoringProduct[];
  siteOptions: Site[];
}>();

const selectedProductIds = defineModel<string[]>("selectedProductIds", { default: [] });
const selectedVariableIds = defineModel<string[]>("selectedVariableIds", { default: [] });
const selectedSiteIds = defineModel<string[]>("selectedSiteIds", { default: [] });

const productOptions = computed<Option[]>(() =>
  props.monitoringProducts.map((product) => ({
    id: product.id,
    humanReadableName: product.humanReadableName,
  })),
);

const productsForVariableOptions = computed(() => {
  if (selectedProductIds.value.length === 0) {
    return props.monitoringProducts;
  }
  return props.monitoringProducts.filter((product) => selectedProductIds.value.includes(product.id));
});

const variableOptions = computed<Option[]>(() =>
  productsForVariableOptions.value.flatMap((product) =>
    product.variables.map((v) => ({
      id: `${product.id}::${v.id}`,
      humanReadableName: v.humanReadableName,
    })),
  ),
);

function onMapMarkerClick(ids: string[]) {
  const union = selectedSiteIds.value.concat(ids);
  const intersection = selectedSiteIds.value.filter((id) => ids.includes(id));
  selectedSiteIds.value = union.filter((id) => !intersection.includes(id));
}

watch(
  () => props.siteOptions,
  () => {
    mapKey.value = Math.random();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.map {
  height: 550px;
}
</style>
