<template>
  <div>Monitoring search result</div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watch } from "vue";
import { backendUrl } from "@/lib";
const trigger = ref(null);

async function fetchData() {
  try {
    const res = await axios.get(`${backendUrl}monitoring-visualizations/`);
    console.log(res.data);
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
