<template>
  <main class="pagewidth">
    Date
    <DatePicker class="date-picker" name="date" v-model="selectedDate" :end="today" :disabled="status === 'loading'" />
    <BaseSpinner v-if="status === 'loading' && files.length === 0" />
    <span v-else-if="status === 'error'"> Failed to load files... </span>
    <template v-else-if="files.length">
      <div class="upload-stats-header" :class="{ loading: status === 'loading' }">
        <div class="donut">
          <Donut :data="donutData" />
        </div>
        <DonutLegend :data="stats" fontSize="175%" />
      </div>
      <div class="table-wrapper" :class="{ loading: status === 'loading' }">
        <table class="file-table">
          <thead class="table-header">
            <tr>
              <th>Filename</th>
              <th v-if="showTags">Tags</th>
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
              <td v-if="showTags">{{ file.tags.join(", ") }}</td>
              <td>{{ humanReadableSize(file.size) }}</td>
              <td :class="getStatusClass(file.status)">{{ file.status }}</td>
              <td>{{ formatTimestamp(file.createdAt) }}</td>
              <td>{{ formatTimestamp(file.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <p v-else class="no-data">No raw data available</p>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import axios from "axios";
import { backendUrl, compareValues, dateToString, humanReadableSize } from "@/lib";
import Donut from "@/components/DonutVisualization.vue";
import DonutLegend from "@/components/DonutLegend.vue";
import DatePicker from "@/components/DatePicker.vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { Status, Upload } from "@shared/entity/Upload";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import { useRouteQuery, queryString } from "@/lib/useRouteQuery";

export interface Props {
  instrumentInfo: InstrumentInfo;
}

const props = defineProps<Props>();

const formatTimestamp = (date: string | Date) => date.toString().replace("T", " ").split(".")[0];

const status = ref<"loading" | "error" | "ready">("loading");

const files = ref<Upload[]>([]);

const showTags = computed(() => files.value.some((file) => file.tags.length > 0));

const today = dateToString(new Date());

const selectedDate = useRouteQuery({ name: "date", defaultValue: today, type: queryString });

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
    { label: "Uploaded", title: "Successfully uploaded files", value: uploaded + processed },
    { label: "Processed", title: "Files processed into product(s)", value: processed },
    { label: "Created", title: "Files with only metadata received", value: created },
    { label: "Invalid", title: "Files marked invalid manually", value: invalid },
  ];
});

const statusOrder: Record<Status, number> = {
  processed: 1,
  uploaded: 2,
  created: 3,
  invalid: 4,
};

async function fetchData() {
  try {
    status.value = "loading";
    const fileResponse = await axios.get<Upload[]>(`${backendUrl}raw-files`, {
      params: {
        instrumentPid: props.instrumentInfo.pid,
        date: selectedDate.value,
      },
    });
    files.value = fileResponse.data.sort((a, b) => {
      if (a.status === b.status) {
        return compareValues(a.filename + a.tags.join(), b.filename + b.tags.join());
      }
      return compareValues(statusOrder[a.status], statusOrder[b.status]);
    });
    status.value = "ready";
  } catch (err) {
    status.value = "error";
    console.error(err);
  }
}

watch(
  () => [selectedDate.value],
  async () => {
    await fetchData();
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

.loading {
  pointer-events: none;
  opacity: 0.5;
}

@media screen and (max-width: $narrow-screen) {
  .upload-stats-header .donut {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
