<template>
  <div>Monitoring search results</div>
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
  console.log("props:", props.productIds);
  try {
    const res = await axios.get(`${backendUrl}monitoring-visualizations/`);
    console.log(res.data);
    monitoringVisualisations.value = res.data;
  } catch (err) {
    console.error(err);
  }
}

watch(
  trigger,
  async () => {
    await fetchData();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss"></style>
