<template>
  <div>
    <div class="year-viz-wrapper" v-if="year">
      <table class="year-viz" v-memo="[yearGrid]">
        <thead>
          <tr>
            <th></th>
            <th v-for="header in monthLabels" :key="header.month" :colspan="header.length">
              {{ MONTH_NAMES[header.month] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(weekday, i) in yearGrid" :key="i">
            <th>{{ i % 2 === 0 ? WEEKDAY_NAMES[i] : "" }}</th>
            <td v-for="(column, j) in weekday" :key="j">
              <component
                :is="column.data?.link ? RouterLink : 'a'"
                v-if="column !== undefined"
                :to="column.data?.link"
                @mouseenter="showYearVizTooltip(column, $event)"
                @mouseleave="hideTooltip"
              >
                <div :style="{ background: column.data ? colors[column.data.color] : undefined }"></div>
              </component>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="years" ref="$years" v-else></div>
    <div class="tooltip" ref="$tooltip" :style="tooltipStyle" v-if="$slots.tooltip && currentDate">
      <slot name="tooltip" :date="currentDate.date" :data="currentDate.data"></slot>
    </div>
    <ul class="legend" v-if="legend">
      <li class="legend-item" v-for="(label, color) in legend" :key="color">
        <div class="legend-color" :style="{ background: colors[color] }"></div>
        {{ label }}
      </li>
    </ul>
    <ul class="legend" v-if="scale">
      <li class="legend-item">
        Less
        <div v-for="color in scale" :key="color" class="legend-color" :style="{ background: colors[color] }"></div>
        More
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup generic="T">
import { compareValues, dateToString } from "@/lib";
import { ref, computed, nextTick, watchEffect, type Ref } from "vue";
import { RouterLink } from "vue-router";

export type DataItem<X> = X & {
  date: string;
  color: string;
  link?: string;
};

export interface Props<X> {
  legend?: Record<string, string>;
  scale?: string[];
  colors: Record<string, string>;
  data: DataItem<X>[];
  year?: number;
}

interface DateItem<X> {
  date: string;
  dateObj: Date;
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

/// Get day of the year in UTC.
function dayOfYear(date: Date): number {
  const start = new Date(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/// Get day of the week in UTC. Returns 0 for Monday, 1 for Tuesday, and so on.
function dayOfWeek(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function initYear(year: number): YearItem<T> {
  const today = new Date();
  const currentDate = new Date(`${year}-01-01`);
  const dates = [];
  while (currentDate.getUTCFullYear() == year && currentDate < today) {
    dates.push({ date: dateToString(currentDate), dateObj: new Date(currentDate), data: null });
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

const yearGrid = computed(() => {
  const output: (DateItem<T> | undefined)[][] = [[], [], [], [], [], [], []];
  const yearItem = dataByYear.value.find((item) => item.year === props.year);
  if (!yearItem) return output;
  const allDates = yearItem.dates;
  const startIndex = dayOfWeek(allDates[0].dateObj);
  for (let i = 0; i < startIndex; i++) {
    output[i].push(undefined);
  }
  for (let i = 0; i < allDates.length; i++) {
    output[(i + startIndex) % 7].push(allDates[i]);
  }
  return output;
});

const monthLabels = computed(() => {
  if (!yearGrid.value) return;
  const output = [{ month: 0, length: 0 }];
  for (let i = 0; i < yearGrid.value[0].length; i++) {
    let maxMonth = 0;
    for (let j = 0; j < 7; j++) {
      const month = yearGrid.value[j][i]?.dateObj.getUTCMonth();
      if (typeof month !== "undefined" && month > maxMonth) {
        maxMonth = month;
      }
    }
    const item = output[output.length - 1];
    if (item.month === maxMonth) {
      item.length += 1;
    } else {
      output.push({ month: maxMonth, length: 1 });
    }
  }
  return output;
});

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    $canvas.addEventListener("mouseenter", (event) => showFullVizTooltip(yearData, event));
    $canvas.addEventListener("mousemove", (event) => showFullVizTooltip(yearData, event));
    $canvas.addEventListener("mouseleave", (_event) => hideTooltip());
    $wrapper.appendChild($canvas);

    const ctx = $canvas.getContext("2d");
    if (!ctx) return;
    yearData.dates.forEach((dateData, dateIndex) => {
      if (!dateData.data || !props.colors[dateData.data.color]) return;
      ctx.fillStyle = props.colors[dateData.data.color];
      ctx.fillRect(dateIndex, 0, 1, 1);
    });
  });
});

function showFullVizTooltip(year: YearItem<T>, event: MouseEvent) {
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

  const x = canvasRect.x + dateIndex * (canvasRect.width / year.dates.length);
  const y = canvasRect.bottom;

  nextTick(() => showTooltipAt(x, y));
}

function showYearVizTooltip(item: DateItem<T>, event: MouseEvent) {
  currentDate.value = item;

  const $target = event.target as HTMLElement;
  const targetRect = $target.getBoundingClientRect();
  const x = targetRect.x + targetRect.width / 2;
  const y = targetRect.bottom;

  nextTick(() => showTooltipAt(x, y));
}

function showTooltipAt(x: number, y: number) {
  if (!$tooltip.value) return;
  const tooltipWidth = $tooltip.value.getBoundingClientRect().width;
  const tooltipMargin = 10;
  const tooltipTop = y + 5;
  const tooltipLeft = Math.min(
    Math.max(tooltipMargin, x - tooltipWidth / 2),
    document.body.scrollWidth - tooltipWidth - tooltipMargin,
  );
  tooltipStyle.value = {
    top: `${tooltipTop}px`,
    left: `${tooltipLeft}px`,
  };
}

function hideTooltip() {
  currentDate.value = null;
}
</script>

<style scoped lang="scss">
$year-height: 1rem;

.years {
  display: grid;
  grid-template-columns: min-content auto;
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
  white-space: nowrap;
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

.year-viz-wrapper {
  overflow-x: auto;
}

.year-viz {
  $block-size: 12px;

  th {
    font-size: 10px;
    color: #444;
    height: $block-size;
    line-height: $block-size;
    white-space: nowrap;
    vertical-align: middle;
  }

  thead th {
    padding-bottom: 2px;
  }

  tbody th {
    padding-right: 2px;
  }

  td {
    min-width: $block-size;
  }

  a {
    display: block;
    padding: 1px;
    width: $block-size;
    height: $block-size;
  }

  div {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    width: 100%;
    height: 100%;
  }
}
</style>
