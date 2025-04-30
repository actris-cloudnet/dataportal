<template>
  <main class="pagewidth">
    <div class="calibration-container">
      <component
        v-if="calibrationDataState === 'success' && InstrumentComponent"
        :is="InstrumentComponent"
        :calibrationData="calibrationData"
      />
      <div v-if="calibrationDataState === 'success' && InstrumentComponent">
        <a :href="apiUrl">Data in calibration API</a>
      </div>
      <div v-else-if="calibrationDataState === 'success' && !InstrumentComponent" class="no-visualization">
        Calibration visualisation is unavailable. View calibration data via the <a :href="apiUrl">calibration API</a>
      </div>
      <div v-else-if="calibrationDataState === 'clientError'" class="no-data">No calibration data available</div>
      <div v-else-if="calibrationDataState === 'serverError'">There is a server-side error.</div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, type Component } from "vue";
import axios from "axios";
import type { AxiosResponse } from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { CalibrationList } from "@shared/entity/Calibration";
import DopplerLidarCalibration from "@/components/instrument/calibration/DopplerLidarCalibration.vue";
import CeilometerCalibration from "@/components/instrument/calibration/CeilometerCalibration.vue";
import DisdrometerCalibration from "@/components/instrument/calibration/DisdrometerCalibration.vue";
import HatproCalibration from "@/components/instrument/calibration/HatproCalibration.vue";
import RadarCalibration from "@/components/instrument/calibration/RadarCalibration.vue";
import WeatherStationCalibration from "./calibration/WeatherStationCalibration.vue";
import { backendUrl } from "@/lib/index";

async function fetchCalibrationData(instrumentPid: string): Promise<AxiosResponse<CalibrationList>> {
  try {
    return await axios.get(`${backendUrl}calibration`, { params: { instrumentPid } });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}

const props = defineProps<{ instrumentInfo: InstrumentInfo }>();

const instrumentComponentsMap: Record<string, Component> = {
  "halo-doppler-lidar": DopplerLidarCalibration,
  "chm15k": CeilometerCalibration,
  "chm15kx": CeilometerCalibration,
  "cl51": CeilometerCalibration,
  "cl31": CeilometerCalibration,
  "ct25k": CeilometerCalibration,
  "parsivel": DisdrometerCalibration,
  "hatpro": HatproCalibration,
  "cs135": CeilometerCalibration,
  "copernicus": RadarCalibration,
  "pollyxt": CeilometerCalibration,
  "weather-station": WeatherStationCalibration,
  "mira-10": RadarCalibration,
  "mira-35": RadarCalibration,
};

const InstrumentComponent = computed(() => {
  const { id } = props.instrumentInfo.instrument;
  return instrumentComponentsMap[id] || null;
});

const apiUrl = computed(() => `${backendUrl}calibration?instrumentPid=${props.instrumentInfo.pid}`);

type DataState = "loading" | "success" | "clientError" | "serverError";
const calibrationDataState = ref<DataState>("loading");

const calibrationData = ref<CalibrationList | null>(null);

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

  .no-data,
  .no-visualization {
    margin-top: 2rem;
  }

  .no-data {
    color: gray;
  }
}
</style>
