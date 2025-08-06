<template>
  <div>
    <h2>Search Filters</h2>

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
import axios from "axios";
import { ref, watch, computed, toRef } from "vue";
import { backendUrl } from "@/lib";
import CustomMultiselect, { type Option } from "@/components/MultiSelect.vue";
import type { MonitoringProduct, MonitoringProductVariable } from "@shared/entity/Monitoring";
const trigger = ref(null);

const props = defineProps<{
  monitoringProducts: MonitoringProduct[];
}>();

const selectedProductIds = defineModel<string[]>("selectedProductIds", { default: [] });
const selectedVariableIds = defineModel<string[]>("selectedVariableIds", { default: [] });

const productOptions = computed<Option[]>(() =>
  props.monitoringProducts.map((product) => ({
    id: product.id,
    humanReadableName: product.humanReadableName,
  })),
);

const variableOptions = computed<Option[]>(() =>
  props.monitoringProducts.flatMap((product) =>
    product.variables.map((v) => ({
      id: `${product.id}::${v.id}`,
      humanReadableName: v.humanReadableName,
    })),
  ),
);

watch(trigger, async () => {}, { immediate: true });
</script>

<style scoped lang="scss"></style>
