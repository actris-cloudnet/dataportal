<template>
  <main class="pagewidth">
    <h2>Instrument</h2>
    <dl>
      <dt>PID</dt>
      <dd>
        <a :href="instrumentInfo.pid">{{ instrumentInfo.pid }}</a>
      </dd>
      <dt>{{ instrumentInfo.owners.length === 1 ? "Owner" : "Owners" }}</dt>
      <dd>
        <ul>
          <li v-for="owner in instrumentInfo.owners" :key="owner">{{ owner }}</li>
        </ul>
      </dd>
      <dt>Model</dt>
      <dd>{{ instrumentInfo.model }}</dd>
      <dt>Type</dt>
      <dd>{{ instrumentInfo.type }}</dd>
      <template v-if="instrumentInfo.serialNumber">
        <dt>Serial number</dt>
        <dd>{{ instrumentInfo.serialNumber }}</dd>
      </template>
    </dl>
    <template v-if="instrumentInfo.locations.length > 0">
      <h2>Locations</h2>
      <table class="locations">
        <tr v-for="location in instrumentInfo.locations" :key="location.siteId">
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
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";

import type { InstrumentInfo } from "@shared/entity/Instrument";
import { dateToString } from "@/lib";
import { parseDataStatus, parseUploadStatus, type DataStatus, type UploadStatus } from "@/lib/DataStatusParser";
import InstrumentVisualization from "@/components/InstrumentVisualization.vue";
import UploadVisualization from "@/components/UploadVisualization.vue";
import CustomMultiselect from "@/components/MultiSelect.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";

export interface Props {
  instrumentInfo: InstrumentInfo;
}

const props = defineProps<Props>();

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
  [dataStatus.value, uploadStatus.value] = await Promise.all([
    parseDataStatus({ instrumentPid: props.instrumentInfo.pid }),
    parseUploadStatus(props.instrumentInfo.pid),
  ]);
  if (dataStatus.value.availableProducts.length > 0) {
    selectedViz.value = "products";
  } else if (uploadStatus.value.dates.length > 0) {
    selectedViz.value = "count";
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
