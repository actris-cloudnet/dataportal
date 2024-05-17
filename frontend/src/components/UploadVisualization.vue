<template>
  <DateVisualization :data="dates" :scale="['green1', 'green2', 'green3', 'green4']" :colors="classColor" :year="year">
    <template #tooltip="{ date, data }">
      <div class="mega-tooltip" style="width: 150px">
        <header>{{ date }}</header>
        <section>
          <ul>
            <li v-if="props.type === 'size'">{{ data ? data["size"] : "No files" }}</li>
            <li v-else>{{ data ? data["count"] : "No files" }}</li>
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

export interface Props {
  uploadStatus: UploadStatus;
  type: "size" | "count";
  year?: number;
}

const props = defineProps<Props>();
const dates = computed(() =>
  props.uploadStatus.dates.map((date) => ({
    date: date.date,
    color: props.type === "size" ? createColorClass(date.totalSize) : createColorClass(date.fileCount),
    count: formatCount(date.fileCount),
    size: humanReadableSize(date.totalSize),
  })),
);

function formatCount(count: number): string {
  const suffix = count === 1 ? " file" : " files";
  return count + suffix;
}

function createColorClass(statistics: number): ColorClass {
  const reference = props.type === "size" ? props.uploadStatus.maxSize : props.uploadStatus.maxCount;
  const percentage = (statistics / reference) * 100;
  if (statistics === 0) {
    return "no-data";
  } else if (percentage < 30) {
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

<style src="@/sass/tooltip.scss" />
