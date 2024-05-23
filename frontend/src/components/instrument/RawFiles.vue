<template>
  <div v-if="instrumentInfo.status === 'ready'">
    <main class="pagewidth">
      Date
      <datepicker class="date-picker" name="date" v-model="selectedDate" :start="beginningOfHistory" :end="today" />
      <template v-if="files.length">
        <div class="upload-stats-header">
          <div class="donut">
            <Donut :data="donutData" />
          </div>
          <DonutLegend :data="stats" :fontSize="'175%'" />
        </div>
        <div class="table-wrapper">
          <table class="file-table">
            <thead class="table-header">
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Status</th>
                <th>Created (UTC)</th>
                <th>Updated (UTC)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in files" :key="file.uuid">
                <td>
                  <a :href="file.downloadUrl" target="_blank">{{ file.filename }}</a>
                </td>
                <td>{{ humanReadableSize(file.size) }}</td>
                <td :class="getStatusClass(file.status)">{{ file.status }}</td>
                <td>{{ formatTimestamp(file.createdAt) }}</td>
                <td>{{ formatTimestamp(file.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template v-else>
        <p class="no-data">No files found for this instrument on this date.</p>
      </template>
    </main>
  </div>
  <ApiError :response="(instrumentInfo.error as any).response" v-else-if="instrumentInfo.status === 'error'" />
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { backendUrl, humanReadableSize } from "@/lib";
import Donut from "@/components/DonutVisualization.vue";
import DonutLegend from "@/components/DonutLegend.vue";
import ApiError from "@/views/ApiError.vue";
import type { InstrumentPidResult } from "@/components/instrument/InstrumentOverview.vue";
import Datepicker from "@/components/DatePicker.vue";
import type { Upload } from "@shared/entity/Upload";

const formatTimestamp = (date: string | Date) => date.toString().replace("T", " ").split(".")[0];

const files = ref<Upload[]>([]);
const route = useRoute();
const router = useRouter();

const instrumentInfo = ref<InstrumentPidResult>({ status: "loading" });
const beginningOfHistory = "2001-01-01";
const today = new Date().toISOString().split("T")[0];

const selectedDate = ref<string>(route.query.date as string);

onMounted(async () => {
  if (!selectedDate.value) {
    selectedDate.value = today;
  }
});

const donutData = computed(() => {
  const created = files.value.filter((file) => file.status === "created").length;
  const uploaded = files.value.filter((file) => file.status === "uploaded").length;
  const processed = files.value.filter((file) => file.status === "processed").length;
  const invalid = files.value.filter((file) => file.status === "invalid").length;
  return [
    { value: created, color: "lightyellow" },
    { value: uploaded, color: "#99c68e" },
    { value: processed, color: "#6aa121" },
    { value: invalid, color: "lightcoral" },
  ];
});

const stats = computed(() => {
  const created = files.value.filter((file) => file.status === "created").length;
  const uploaded = files.value.filter((file) => file.status === "uploaded").length;
  const processed = files.value.filter((file) => file.status === "processed").length;
  const invalid = files.value.filter((file) => file.status === "invalid").length;

  return [
    { label: "Uploaded", title: "Succesfully uploaded files", value: uploaded + processed },
    { label: "Processed", title: "Files processed into product(s)", value: processed },
    { label: "Created", title: "Files with only metadata received", value: created },
    { label: "Invalid", title: "Files marked invalid manually", value: invalid },
  ];
});

async function fetchData() {
  try {
    const instrumentResponse = await axios.get(`${backendUrl}instrument-pids/${route.params.uuid}`);
    instrumentInfo.value = { status: "ready", value: instrumentResponse.data };
    const fileResponse = await axios.get(`${backendUrl}raw-files`, {
      params: {
        instrumentPid: instrumentInfo.value.value.pid,
        date: selectedDate.value,
      },
    });
    files.value = fileResponse.data;
    files.value.sort((a, b) => a.status.localeCompare(b.status));
  } catch (error) {
    instrumentInfo.value = { status: "error", error: error as Error };
  }
}

watch(
  () => [selectedDate.value],
  async () => {
    await fetchData();
    router.push({ query: { date: selectedDate.value } });
  },
  { immediate: true },
);

function getStatusClass(status: string) {
  switch (status) {
    case "processed":
      return "status-processed";
    case "uploaded":
      return "status-uploaded";
    case "created":
      return "status-created";
    case "invalid":
      return "status-invalid";
    default:
      return "";
  }
}
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.file-table {
  margin-bottom: 5rem;
}

.status-processed {
  background-color: #6aa121;
}

.status-uploaded {
  background-color: #99c68e;
}

.status-created {
  background-color: lightyellow;
}

.status-invalid {
  background-color: lightcoral;
}

.table-wrapper {
  overflow-x: auto;
}

td {
  padding-right: 10px;
  padding-left: 10px;
  padding-bottom: 2px;
  padding-top: 2px;
  text-align: center;
}

tr {
  border-bottom: 1px solid #ddd;
}

.table-header {
  text-align: center;
  font-weight: bold;
}

.upload-stats-header {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  padding-bottom: 1rem;
  padding-top: 1rem;

  .donut {
    margin-right: 4rem;
  }
}

.date-picker {
  margin-bottom: 1rem;
}

.no-data {
  margin-top: 2rem;
  color: gray;
}

@media screen and (max-width: $narrow-screen) {
  .upload-stats-header .donut {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
