<template>
  <div v-if="instrumentInfo.status === 'ready'">
    <LandingHeader :title="instrumentInfo.value.name" :subtitle="instrumentInfo.value.instrument.humanReadableName">
      <template #tabs>
        <router-link class="tab" :to="{ name: 'Instrument' }">
          <img :src="getInstrumentIcon(instrumentInfo.value.instrument)" alt="" />
          Overview
        </router-link>
        <router-link class="tab" :to="{ name: 'RawFiles' }">
          <img :src="folderIcon" alt="" />
          Raw files
        </router-link>
        <router-link class="tab" :to="{ name: 'Logbook' }">
          <img :src="logIcon" alt="" />
          Logbook
        </router-link>
        <router-link class="tab" :to="{ name: 'InstrumentCalibration' }">
          <img :src="CalibrationIcon" alt="" />
          Calibration
        </router-link>
      </template>
    </LandingHeader>
    <router-view :instrumentInfo="instrumentInfo.value" />
  </div>
  <ApiError :response="(instrumentInfo.error as any).response" v-else-if="instrumentInfo.status === 'error'" />
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import LandingHeader from "@/components/LandingHeader.vue";
import folderIcon from "@/assets/icons/icons8-folder-48.png";
import CalibrationIcon from "@/assets/icons/calibration.svg";
import logIcon from "@/assets/icons/icons8-log-48.png";
import { backendUrl, getInstrumentIcon } from "@/lib";
import { useTitle } from "@/router";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import ApiError from "@/views/ApiError.vue";

type InstrumentInfoResult =
  | { status: "loading" }
  | { status: "ready"; value: InstrumentInfo }
  | { status: "error"; error: Error };

const route = useRoute();
const uuid = route.params.uuid as string;
const instrumentInfo = ref<InstrumentInfoResult>({ status: "loading" });

const title = computed(() => {
  if (instrumentInfo.value.status === "ready") {
    return [instrumentInfo.value.value.name, "Instruments"];
  }
  return ["Instruments"];
});

useTitle(title);

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}instrument-pids/${uuid}`);
    instrumentInfo.value = { status: "ready", value: res.data };
  } catch (error) {
    instrumentInfo.value = { status: "error", error: error as Error };
  }
});
</script>
