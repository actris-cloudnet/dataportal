<template>
  <DateVisualization :data="dates" :scale="['green1', 'green2', 'green3', 'green4']" :colors="classColor" :year="year">
    <template #tooltip="{ date, data }">
      <div class="mega-tooltip">
        <header>{{ date }}</header>
        <section>
          <ul>
            <li v-if="props.type === 'size'">{{ data ? data.size : "No files" }}</li>
            <li v-else>{{ data ? data.count : "No files" }}</li>
          </ul>
        </section>
      </div>
    </template>
  </DateVisualization>
</template>

<script lang="ts" setup>
import { classColor, humanReadableSize, type ColorClass } from "@/lib";
import type { UploadStatus } from "@/lib/DataStatusParser";
import { computed } from "vue";
import DateVisualization from "./DateVisualization.vue";
import router from "@/router";

export interface Props {
  uploadStatus: UploadStatus;
  type: "size" | "count";
  year?: number;
}

const props = defineProps<Props>();

const dates = computed(() => {
  return props.uploadStatus.dates.map((date) => ({
    date: date.date,
    color: getColorClass(date),
    count: formatCount(date.fileCount),
    size: humanReadableSize(date.totalSize),
    link: createLink(date.date),
  }));
});

function createLink(date: string): string {
  return router.resolve({
    name: "Raw Files",
    query: {
      date: date.substring(0, 10),
    },
  }).href;
}

function formatCount(count: number): string {
  return `${count} ${count === 1 ? "file" : "files"}`;
}

function getColorClass(date: { totalSize: number; fileCount: number }): ColorClass {
  const statistics = props.type === "size" ? date.totalSize : date.fileCount;
  const reference = props.type === "size" ? props.uploadStatus.maxSize : props.uploadStatus.maxCount;
  return createColorClass(statistics, reference);
}

function createColorClass(statistics: number, reference: number): ColorClass {
  if (statistics === 0) {
    return "no-data";
  }
  const percentage = (statistics / reference) * 100;
  if (percentage < 30) {
    return "green1";
  } else if (percentage < 60) {
    return "green2";
  } else if (percentage < 95) {
    return "green3";
  } else {
    return "green4";
  }
}
</script>

<style scoped>
.mega-tooltip {
  width: 150px;
}
</style>
