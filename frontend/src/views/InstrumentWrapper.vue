<template>
  <div v-if="instrumentInfo.status === 'ready'">
    <LandingHeader :title="instrumentInfo.value.name" :subtitle="instrumentInfo.value.instrument.humanReadableName">
      <template #tabs>
        <router-link class="tab" :to="{ name: 'Instrument' }">
          <img :src="overviewIcon" alt="" />
          Overview
        </router-link>
        <router-link class="tab" :to="{ name: 'Raw Files' }">
          <img :src="folderIcon" alt="" />
          Raw files
        </router-link>
      </template>
    </LandingHeader>
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import LandingHeader from "@/components/LandingHeader.vue";
import overviewIcon from "@/assets/icons/overview.png";
import folderIcon from "@/assets/icons/folder.png";
import { backendUrl } from "@/lib";
import type { InstrumentPidResult } from "@/components/instrument/InstrumentOverview.vue";

const route = useRoute();
const uuid = route.params.uuid as string;
const instrumentInfo = ref<InstrumentPidResult>({ status: "loading" });

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}instrument-pids/${uuid}`);
    instrumentInfo.value = { status: "ready", value: res.data };
  } catch (error) {
    instrumentInfo.value = { status: "error", error: error as Error };
  }
});
</script>
