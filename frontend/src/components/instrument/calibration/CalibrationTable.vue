<template>
  <div class="table-container" v-if="formattedTableData.length">
    <h2>{{ props.config.title }}</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>{{ props.config.label }}</th>
          <th>Updated at</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in formattedTableData" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            <div v-if="Array.isArray(cell)" class="multiline-cell">
              <a v-for="(url, urlIndex) in cell" :key="urlIndex" :href="url" target="_blank" rel="noopener noreferrer">
                {{ extractFileName(url) }}
              </a>
            </div>
            <span v-else-if="typeof cell === 'boolean'">
              {{ cell ? "Yes" : "No" }}
            </span>
            <span v-else>
              {{ cell }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { humanReadableTimestamp } from "@/lib";

const props = defineProps<{
  data: (string[] | number | boolean | null)[];
  measurementDates: string[];
  timestamps: string[];
  config: {
    title: string;
    label: string;
  };
}>();

function extractFileName(url: string): string {
  return url.split("/").pop()?.substring(17) || url;
}

const formattedTableData = ref<(string | string[] | number | boolean | null)[][]>([]);

watch(
  () => [props.data, props.measurementDates, props.timestamps],
  ([textData, dates, updatedAts]) => {
    const formattedData: (string | string[] | number | boolean | null)[][] = [];

    for (let i = 0; i < textData.length; i++) {
      const row = [];
      row.push(dates[i]);
      row.push(textData[i]);
      row.push(humanReadableTimestamp(updatedAts[i] as string));
      if (!row.some((cell) => cell === null)) {
        formattedData.push(row);
      }
    }
    formattedTableData.value = formattedData;
  },
  { immediate: true },
);
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  margin-bottom: 30px;
  min-width: 35rem;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.multiline-cell a {
  display: block; /* Each link will be on a new line */
  text-decoration: none;
}

.multiline-cell a:hover {
  text-decoration: underline;
}
</style>
