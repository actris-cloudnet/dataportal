<template>
  <main class="pagewidth">
    <div class="calibration-container">
      <component
        v-if="calibrationDataState === 'success' && InstrumentComponent"
        :is="InstrumentComponent"
        :instrumentInfo="props.instrumentInfo"
        :calibrationData="calibrationData"
      />
      <div v-else-if="calibrationDataState === 'success' && !InstrumentComponent">
        Calibration visualization is not yet available. You can view the calibration data directly through the
        calibration API.
      </div>
      <div v-else-if="calibrationDataState === 'clientError'">Calibration data is not available.</div>
      <div v-else-if="calibrationDataState === 'serverError'">There is a server-side error.</div>
      <div>
        <a :href="apiUrl">Data in Calibration API</a>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { AxiosResponse } from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import DopplerLidarCalibration from "@/components/instrument/calibration/DopplerLidarCalibration.vue";
import CeilometerCalibration from "@/components/instrument/calibration/CeilometerCalibration.vue";
import { backendUrl } from "@/lib/index";

async function fetchCalibrationData(instrumentPid: string): Promise<AxiosResponse<any> | undefined> {
  try {
    const response = await axios.get(`${backendUrl}calibration?instrumentPid=${instrumentPid}`);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}

export interface Props {
  instrumentInfo: InstrumentInfo;
}

const props = defineProps<Props>();

const instrumentComponentsMap: { [key: string]: any } = {
  "halo-doppler-lidar": DopplerLidarCalibration,
  "chm15k": CeilometerCalibration,
  "chm15kx": CeilometerCalibration,
  "cl51": CeilometerCalibration,
};

const InstrumentComponent = computed(() => {
  const { id } = props.instrumentInfo.instrument;
  return instrumentComponentsMap[id] || null;
});

const apiUrl = computed(() => `${backendUrl}calibration?instrumentPid=${props.instrumentInfo.pid}`);

type DataState = "loading" | "success" | "clientError" | "serverError";
const calibrationDataState = ref<DataState>("loading");

const calibrationData = ref<any | null>(null);

onMounted(async () => {
  try {
    const response = await fetchCalibrationData(props.instrumentInfo.pid);

    if (response && response.status >= 200 && response.status < 300) {
      calibrationData.value = response.data;
      calibrationDataState.value = "success";
    } else if (response && response.status >= 400 && response.status < 500) {
      calibrationDataState.value = "clientError";
    } else if (response && response.status >= 500) {
      calibrationDataState.value = "serverError";
    }
  } catch (err) {
    console.error(err);
    calibrationDataState.value = "serverError";
  }
});
</script>

<style scoped>
.calibration-container {
  margin-bottom: 20px;
}
</style>
