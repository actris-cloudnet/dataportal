<template>
  <div v-if="model">
    <LandingHeader :title="model.humanReadableName" subtitle="Cloudnet model product"></LandingHeader>
    <RawFiles :siteId="$route.query.site as string" :modelId="model.id" />
  </div>
</template>

<script lang="ts" setup>
import RawFiles from "@/components/RawFiles.vue";
import LandingHeader from "@/components/LandingHeader.vue";
import { backendUrl } from "@/lib";
import type { Model } from "@shared/entity/Model";
import axios from "axios";
import { onMounted, ref } from "vue";

export interface Props {
  modelId: string;
}

const props = defineProps<Props>();

const model = ref<Model | null>(null);

onMounted(async () => {
  const res = await axios.get(`${backendUrl}models/${props.modelId}`);
  model.value = res.data;
});
</script>
