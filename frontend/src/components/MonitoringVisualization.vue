<template>
  <div class="monitoring-visualization">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="`Visualization for ${props.data.monitoringProductVariable.humanReadableName}`"
      :width="props.data.width"
      :height="props.data.height"
    />
    <div v-else>No image available.</div>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watch, toRaw, computed } from "vue";
import { backendUrl } from "@/lib";
import type { MonitoringVisualization as VisualizationData } from "@shared/entity/Monitoring";

const trigger = ref(null);

const props = defineProps<{ data: VisualizationData }>();

const imageUrl = computed(() => (props.data?.s3key ? `${backendUrl}download/image/${props.data.s3key}` : null));

console.log(toRaw(props.data));
</script>

<style scoped lang="scss"></style>
