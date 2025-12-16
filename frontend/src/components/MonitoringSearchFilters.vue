<template>
  <div>
    <div class="filterbox">
      <SuperMap
        :key="mapKey"
        :sites="siteOptions"
        :selectedSiteIds="selectedSiteIds"
        :onMapMarkerClick="onMapMarkerClick"
        :center="[57, 12.0]"
        :zoom="2.5"
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
      <MonitoringPeriodSelect v-model:period="period" v-model:startDate="startDate" />
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
      <!-- v-if prevents custom multiselect from clearing the selected variables on refresh -->
      <CustomMultiselect
        v-if="variableOptions.length || selectedProductIds.length === 0"
        id="monitoring-variable-select"
        label="Monitoring Variable"
        v-model="selectedVariableIds"
        :options="variableOptions"
        :multiple="true"
      />
    </div>
    <div class="filterbox">
      <CustomMultiselect
        id="monitoring-instrument-select"
        label="Instruments"
        v-model="selectedInstrumentUuids"
        :options="instrumentOptions"
        :multiple="true"
      />
    </div>
    <a class="reset" href="/monitoring">Reset filters</a>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import SuperMap from "@/components/SuperMap.vue";
import type { MonitoringProduct } from "@shared/entity/Monitoring";
import type { Site } from "@shared/entity/Site";
import { getMarkerIcon } from "@/lib";
import MonitoringPeriodSelect from "./MonitoringPeriodSelect.vue";
import type { Instrument } from "@shared/entity/Instrument";
const mapKey = ref(0); // Supermap does not update if the props update. This forces the update

const props = defineProps<{
  monitoringProducts: MonitoringProduct[];
  siteOptions: Site[];
  instruments: Instrument[];
}>();

const selectedProductIds = defineModel<string[]>("selectedProductIds", { default: [] });
const selectedVariableIds = defineModel<string[]>("selectedVariableIds", { default: [] });
const selectedSiteIds = defineModel<string[]>("selectedSiteIds", { default: [] });
const selectedInstrumentUuids = defineModel<string[]>("selectedInstrumentUuids", { default: [] });
const startDate = defineModel<string | undefined>("startDate", { default: undefined });
const period = defineModel<string>("period", { default: "month" });

const productOptions = computed<Option[]>(() =>
  props.monitoringProducts.map((product) => ({
    id: product.id,
    humanReadableName: product.humanReadableName,
  })),
);
const instrumentOptions = computed<Option[]>(() =>
  props.instruments.map((inst) => ({ id: inst.uuid, humanReadableName: inst.name })),
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
    mapKey.value = mapKey.value + 1;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
$lightpadding: 1rem;
$heavypadding: 5rem;

.map {
  width: 100%;
  height: 300px;
  margin-bottom: 1rem;
}
.filterbox {
  margin-bottom: 1rem;
}
</style>
