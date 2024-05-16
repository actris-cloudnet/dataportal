<template>
  <div v-if="instrumentPid.status === 'ready'">
    <LandingHeader :title="instrumentPid.value.name" :subtitle="instrumentPid.value.instrument.humanReadableName" />
    <main class="pagewidth">
      <h2>Instrument</h2>
      <dl>
        <dt>PID</dt>
        <dd>
          <a :href="instrumentPid.value.pid">{{ instrumentPid.value.pid }}</a>
        </dd>
        <dt>{{ instrumentPid.value.owners.length === 1 ? "Owner" : "Owners" }}</dt>
        <dd>
          <ul>
            <li v-for="owner in instrumentPid.value.owners" :key="owner">{{ owner }}</li>
          </ul>
        </dd>
        <dt>Model</dt>
        <dd>{{ instrumentPid.value.model }}</dd>
        <dt>Type</dt>
        <dd>{{ instrumentPid.value.type }}</dd>
        <template v-if="instrumentPid.value.serialNumber">
          <dt>Serial number</dt>
          <dd>{{ instrumentPid.value.serialNumber }}</dd>
        </template>
      </dl>
      <template v-if="instrumentPid.value.locations.length > 0">
        <h2>Locations</h2>
        <table class="locations">
          <tr v-for="location in instrumentPid.value.locations" :key="location.siteId">
            <td>{{ location.startDate }}</td>
            <td>–</td>
            <td>{{ location.endDate >= yesterdayString ? "now" : location.endDate }}</td>
            <td>
              <router-link :to="{ name: 'Site', params: { siteId: location.siteId } }">
                {{ location.humanReadableName }}
              </router-link>
            </td>
          </tr>
        </table>
      </template>

      <template v-if="uploadStatus">
        <template v-if="selectedViz == 'products' && dataStatus && dataStatus.availableProducts.length > 0">
          <h2>Product availability</h2>
          <InstrumentVisualization :dataStatus="dataStatus" :year="selectedYear" />
        </template>
        <template v-else-if="selectedViz == 'count' && uploadStatus && uploadStatus.dates.length > 0">
          <h2>Number of uploaded raw files</h2>
          <UploadVisualization :uploadStatus="uploadStatus" :type="selectedViz" :year="selectedYear" />
        </template>
        <template v-else-if="selectedViz == 'size' && uploadStatus && uploadStatus.dates.length > 0">
          <h2>Total size of uploaded raw files</h2>
          <UploadVisualization :uploadStatus="uploadStatus" :type="selectedViz" :year="selectedYear" />
        </template>
        <template v-if="uploadStatus.dates.length > 0">
          <div class="viz-options">
            <div class="viz-option viz-type-select">
              <custom-multiselect
                v-model="selectedViz"
                label="Visualisation"
                :options="visualisationOptions"
                id="instrumentVizSelect"
              />
            </div>
            <div class="viz-option year-select">
              <custom-multiselect
                v-model="selectedYearOption"
                label="Year"
                :options="yearOptions"
                id="yearSelect"
                clearable
              />
            </div>
          </div>
        </template>
      </template>
      <BaseSpinner v-else class="spinner" />
      <div v-if="uploadStatus && uploadStatus.dates.length === 0">
        <p class="no-data">No data available</p>
      </div>
    </main>
  </div>
  <ApiError :response="(instrumentPid.error as any).response" v-else-if="instrumentPid.status === 'error'" />
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import { backendUrl, dateToString } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import ApiError from "@/views/ApiError.vue";
import { parseDataStatus, parseUploadStatus, type DataStatus, type UploadStatus } from "@/lib/DataStatusParser";
import InstrumentVisualization from "@/components/InstrumentVisualization.vue";
import UploadVisualization from "@/components/UploadVisualization.vue";
import CustomMultiselect from "@/components/MultiSelect.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";

export interface Props {
  uuid: string;
}

const props = defineProps<Props>();

type InstrumentPidResult =
  | { status: "loading" }
  | { status: "ready"; value: InstrumentInfo }
  | { status: "error"; error: Error };

const instrumentPid = ref<InstrumentPidResult>({ status: "loading" });
const selectedViz = ref<string>("");
const dataStatus = ref<DataStatus>();
const uploadStatus = ref<UploadStatus>();

const selectedYearOption = ref<string | null>(null);
const selectedYear = computed(() => (selectedYearOption.value ? parseInt(selectedYearOption.value) : undefined));

const yearOptions = computed(() => {
  if (!uploadStatus.value) return [];
  return uploadStatus.value.years.map((year) => ({ id: year.toString(), humanReadableName: year.toString() }));
});

const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const yesterdayString = dateToString(yesterday);

const visualisationOptions = computed(() => {
  if (!dataStatus.value) return [];
  const a = [
    { id: "products", humanReadableName: "Products" },
    { id: "count", humanReadableName: "File count" },
    { id: "size", humanReadableName: "Total size" },
  ];
  return dataStatus.value.availableProducts.length > 0 ? a : a.filter((option) => option.id !== "products");
});

onMounted(async () => {
  try {
    const res = await axios.get<InstrumentInfo>(`${backendUrl}instrument-pids/${props.uuid}`);
    instrumentPid.value = { status: "ready", value: res.data };
    [dataStatus.value, uploadStatus.value] = await Promise.all([
      parseDataStatus({ instrumentPid: res.data.pid }),
      parseUploadStatus(res.data.pid),
    ]);
    if (dataStatus.value.availableProducts.length > 0) {
      selectedViz.value = "products";
    } else if (uploadStatus.value.dates.length > 0) {
      selectedViz.value = "count";
    }
  } catch (error) {
    instrumentPid.value = { status: "error", error: error as Error };
  }
});
</script>

<style scoped lang="scss">
h2 {
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-size: 130%;
  font-weight: 400;
}

h2:not(:first-child) {
  margin-top: 2rem;
}

dl {
  display: grid;
  grid-template-columns: minmax(min-content, 10rem) auto;
  row-gap: 0.4rem;
}

dt {
  font-weight: 500;
}

.locations {
  border-spacing: 0px 4px;

  td:nth-child(1),
  td:nth-child(3) {
    font-variant: tabular-nums;
    font-size: 90%;
    color: #555;
  }

  td:nth-child(2) {
    padding: 0 0.5rem;
  }

  td:nth-child(3) {
    padding-right: 1rem;
  }
}

.viz-options {
  display: flex;
  gap: 1rem;
  padding-bottom: 5rem;
  align-items: baseline;
}

.no-data {
  margin-top: 2rem;
  color: gray;
}

.viz-type-select {
  width: 200px;
  padding-top: 30px;
}

.year-select {
  width: 130px;
}

.spinner {
  margin-top: 2rem;
}
</style>
