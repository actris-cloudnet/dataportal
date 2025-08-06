<template>
  <div class="results">
      <MonitoringVisualization v-for="(item, index) in monitoringVisualisations" :key="index" :data="item" />
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watch } from "vue";
import { backendUrl } from "@/lib";
import MonitoringVisualization from "@/components/MonitoringVisualization.vue";
const trigger = ref(null);

const props = defineProps<{
  productIds: string[];
  variableIds: string[];
}>();

const monitoringVisualisations = ref([]);

async function fetchData() {
  try {
    const params: Record<string, string | undefined> = {};
    if (props.productIds.length > 0) {
      params.productId = props.productIds.join(",");
    }
    if (props.variableIds.length > 0) {
      params.variableId = props.variableIds.join(",");
    }

    const res = await axios.get(`${backendUrl}monitoring-visualizations/`, {
      params,
    });
    monitoringVisualisations.value = res.data;
  } catch (err) {
    console.error(err);
  }
}

watch(
  () => [props.productIds, props.variableIds],
  async (newIds, oldIds) => {
    if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
      await fetchData();
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.results {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
.result {
  width: 400px;
}

</style>
