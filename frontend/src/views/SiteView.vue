<template>
  <div v-if="!error && response" id="sitelanding">
    <LandingHeader :title="response.humanReadableName" :subtitle="subtitle">
      <template #tags>
        <BaseTag
          v-if="response.actrisId"
          type="actris"
          title="This station is a component of an ACTRIS National Facility."
        >
          ACTRIS
        </BaseTag>
        <BaseTag
          v-if="response.type.includes('cloudnet')"
          type="cloudnet"
          title="Permanent station with Cloudnet instrumentation."
        >
          Cloudnet
        </BaseTag>
        <BaseTag v-if="response.type.includes('campaign')" type="experimental">Campaign</BaseTag>
        <BaseTag v-if="response.type.includes('arm')" type="arm">ARM</BaseTag>
        <BaseTag v-if="response.type.includes('model')" type="volatile">Model</BaseTag>
        <BaseTag v-else-if="response.type.includes('hidden')" type="experimental">Hidden</BaseTag>
      </template>
      <template #tabs>
        <router-link class="tab" :to="{ name: 'Site' }">
          <img :src="radarIcon" alt="" />
          Summary
        </router-link>
        <router-link class="tab" :to="{ name: 'SiteProducts' }">
          <img :src="folderIcon" alt="" />
          Products
        </router-link>
      </template>
    </LandingHeader>
    <router-view :site="response" />
  </div>
  <!-- prettier-ignore -->
  <ApiError :response="(response as any)" v-else-if="error" />
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import axios from "axios";
import type { Site } from "@shared/entity/Site";
import { backendUrl } from "@/lib";
import ApiError from "./ApiError.vue";
import { useTitle } from "@/router";
import BaseTag from "@/components/BaseTag.vue";
import LandingHeader from "@/components/LandingHeader.vue";
import folderIcon from "@/assets/icons/icons8-folder-48.png";
import radarIcon from "@/assets/icons/radar.png";

export interface Props {
  siteId: string;
}

const props = defineProps<Props>();

const response = ref<Site | null>(null);
const error = ref(false);
const title = computed(() => [response.value?.humanReadableName, "Sites"]);

useTitle(title);

const subtitle = computed(() => {
  let result = "Measurement station";
  if (response.value?.country) {
    result += ` in ${response.value.country}`;
  }
  return result;
});

onMounted(() => {
  axios
    .get(`${backendUrl}sites/${props.siteId}`)
    .then((res) => {
      response.value = res.data;
    })
    .catch((e) => {
      error.value = true;
      response.value = e.response;
    });
});
</script>

<style scoped lang="scss">
:deep(.pagewidth) {
  max-width: 1000px;
}
</style>
