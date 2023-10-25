<template>
  <div>
    <div class="years" ref="$years"></div>
    <div class="tooltip" ref="$tooltip" :style="tooltipStyle" v-if="$slots.tooltip && currentDate">
      <slot name="tooltip" :date="currentDate.date" :data="currentDate.data"></slot>
    </div>
    <ul class="legend">
      <li class="legend-item" v-for="(item, key) in legend" :key="key">
        <div class="legend-color" :style="{ background: item.color }"></div>
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup generic="T">
import { compareValues, dateToString } from "@/lib";
import { ref, computed, nextTick, watchEffect, type Ref } from "vue";

export type DataItem<X> = X & {
  date: string;
  color: string;
  link?: string;
};

export interface LegendItem {
  name: string;
  color: string;
}

export interface Props<X> {
  legend: Record<string, LegendItem>;
  data: DataItem<X>[];
}

interface DateItem<X> {
  date: string;
  data: DataItem<X> | null;
}

interface YearItem<X> {
  year: number;
  dates: DateItem<X>[];
}

const props = defineProps<Props<T>>();

const currentDate = ref<DateItem<T> | null>(null) as Ref<DateItem<T> | null>;
const tooltipStyle = ref<Record<string, string>>({});
const $years = ref<HTMLDivElement | null>(null);
const $tooltip = ref<HTMLDivElement | null>(null);

function dayOfYear(date: Date): number {
  const start = new Date(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function initYear(year: number): YearItem<T> {
  const today = new Date();
  const currentDate = new Date(`${year}-01-01`);
  const dates = [];
  while (currentDate.getUTCFullYear() == year && currentDate < today) {
    dates.push({ date: dateToString(currentDate), data: null });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return { year, dates };
}

const dataByYear = computed(() => {
  const sortedData = props.data.slice().sort((a, b) => compareValues(a.date, b.date));
  const output = [];
  while (sortedData.length > 0) {
    const data = sortedData.shift()!;
    const date = new Date(data.date);
    if (output.length == 0 || date.getUTCFullYear() != output[0].year) {
      output.unshift(initYear(date.getUTCFullYear()));
    }
    output[0].dates[dayOfYear(date) - 1].data = data;
  }
  return output;
});

watchEffect(() => {
  if (!$years.value) return;
  while ($years.value.firstChild) {
    $years.value.removeChild($years.value.firstChild);
  }
  dataByYear.value.forEach((yearData, yearIndex, years) => {
    if (yearIndex > 0) {
      const startYear = years[yearIndex - 1].year - 1;
      const stopYear = yearData.year + 1;
      if (stopYear != startYear + 1) {
        const $gap = document.createElement("div");
        $gap.className = "gap";
        $gap.textContent =
          "No data for " + (startYear == stopYear ? `year ${startYear}` : `years ${startYear} – ${stopYear}`);
        $years.value?.appendChild($gap);
      }
    }

    const $year = document.createElement("div");
    $year.textContent = yearData.year.toString();
    $year.className = "year";
    $years.value?.appendChild($year);

    const $wrapper = document.createElement("a");
    $wrapper.style.marginRight = `${(100 * (366 - yearData.dates.length)) / 366}%`;
    $years.value?.appendChild($wrapper);

    const $canvas = document.createElement("canvas");
    $canvas.width = yearData.dates.length;
    $canvas.height = 1;
    $canvas.addEventListener("mouseenter", (event) => setCurrentYearDate(yearData, event));
    $canvas.addEventListener("mousemove", (event) => setCurrentYearDate(yearData, event));
    $canvas.addEventListener("mouseleave", (_event) => hideTooltip());
    $wrapper.appendChild($canvas);

    const ctx = $canvas.getContext("2d");
    if (!ctx) return;
    yearData.dates.forEach((dateData, dateIndex) => {
      if (!dateData.data) return;
      if (!dateData.data || !props.legend[dateData.data.color]) {
        console.log(props.legend, dateData.data.color);
        return;
      }
      ctx.fillStyle = props.legend[dateData.data.color].color;
      ctx.fillRect(dateIndex, 0, 1, 1);
    });
  });
});

function setCurrentYearDate(year: YearItem<T>, event: MouseEvent) {
  const $canvas = event.target as HTMLElement;
  const canvasRect = $canvas.getBoundingClientRect();
  const dateIndex = Math.floor((year.dates.length * (event.clientX - canvasRect.x)) / canvasRect.width);
  currentDate.value = year.dates[dateIndex];

  const $link = $canvas.parentElement as HTMLLinkElement;
  if (currentDate.value?.data?.link) {
    $link.href = currentDate.value.data.link;
  } else {
    $link.removeAttribute("href");
  }

  nextTick(() => {
    if (!$tooltip.value) return;
    const tooltipWidth = $tooltip.value.getBoundingClientRect().width;
    const tooltipMargin = 10;
    const tooltipTop = canvasRect.top + 20;
    const tooltipLeft = Math.min(
      Math.max(tooltipMargin, canvasRect.x + dateIndex * (canvasRect.width / year.dates.length) - tooltipWidth / 2),
      document.body.scrollWidth - tooltipWidth - tooltipMargin,
    );
    tooltipStyle.value = {
      top: `${tooltipTop}px`,
      left: `${tooltipLeft}px`,
    };
  });
}

function hideTooltip() {
  currentDate.value = null;
}
</script>

<style scoped lang="scss">
$year-height: 1rem;

.years {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 0.5rem;
  row-gap: 6px;
}

:deep(a) {
  height: $year-height;
}

:deep(canvas) {
  width: 100%;
  height: $year-height;
  border: 1px solid gray;
  image-rendering: pixelated;
}

:deep(.gap) {
  grid-column: 1 / 3;
  text-align: center;
  color: lightgrey;
  font-style: italic;
  line-height: $year-height;
  height: $year-height;
}

:deep(.year) {
  font-variant: tabular-nums;
  font-size: 90%;
  line-height: $year-height;
  height: $year-height;
}

.tooltip {
  position: fixed;
  z-index: 99;
}

.legend {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.8em;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 1em;
  height: 1em;
  border: solid 1px rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}
</style>
