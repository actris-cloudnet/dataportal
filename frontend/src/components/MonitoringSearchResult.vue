<template>
  <MonitoringVisualization v-for="(item, index) in monitoringVisualisations" :key="index" :data="item" />
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watch } from "vue";
import { backendUrl } from "@/lib";
import MonitoringVisualization from "@/components/MonitoringVisualization.vue";
const trigger = ref(null);

const props = defineProps<{
  productIds: string[];
}>();

const monitoringVisualisations = ref([]);

async function fetchData() {
  console.log("props in search result", props.productIds);
  try {
    const params: Record<string, string | undefined> = {};
    if (props.productIds.length > 0) {
      params.productId = props.productIds.join(",");
    }

    const res = await axios.get(`${backendUrl}monitoring-visualizations/`, {
      params,
    });
    console.log(res.data);
    monitoringVisualisations.value = res.data;
  } catch (err) {
    console.error(err);
  }
}

watch(
  () => props.productIds,
  async (newIds, oldIds) => {
    if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
      await fetchData();
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss"></style>
