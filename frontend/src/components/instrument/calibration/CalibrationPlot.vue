<template>
  <div ref="plotContainer" class="plot-container"></div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, onUnmounted } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { useTemplateRef } from "vue";

const props = defineProps<{
  measurementDates: string[];
  data: (number | null)[];
  config: {
    title: string;
    label: string;
    color?: string;
  };
}>();

const plotHeight = 400;

const plotContainer = useTemplateRef("plotContainer");
let plotInstance: uPlot | null = null;

const createTypedData = (measurementDates: string[], data: (number | null)[]) => {
  const timestamps = measurementDates.map((ts) => new Date(ts).getTime() / 1e3);
  const filteredData = data.reduce<{ timestamps: number[]; values: number[] }>(
    (acc, value, index) => {
      if (value !== null) {
        acc.timestamps.push(timestamps[index]);
        acc.values.push(value);
      }
      return acc;
    },
    { timestamps: [], values: [] },
  );
  filteredData.values = filteredData.values.map((value) => value);
  return [new Float64Array(filteredData.timestamps), new Float64Array(filteredData.values)];
};

const typedData = createTypedData(props.measurementDates, props.data);

const createPlotOptions = (config: { title: string; label: string; color?: string }, width: number): uPlot.Options => {
  const minY = Math.min(...typedData[1]);
  const maxY = Math.max(...typedData[1]);

  return {
    title: config.title,
    id: "calibration-plot",
    class: "calibration-plot",
    width: width,
    height: plotHeight,
    tzDate: (ts) => uPlot.tzDate(new Date(ts * 1e3), "UTC"),
    series: [
      {
        value: "{YYYY}-{MM}-{DD}",
      },
      {
        label: config.label,
        stroke: config.color || "#5F95DC",
        width: 1,
        paths: uPlot.paths && uPlot.paths.stepped ? uPlot.paths.stepped({ align: 1 }) : undefined,
        points: {
          size: 10,
        },
        value: (_self, v) => {
          if (v === null || v === undefined) {
            return "--";
          } else {
            if (Number.isInteger(v)) {
              return v.toString();
            } else {
              if (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3) {
                return v.toExponential(2);
              } else {
                return v.toFixed(3);
              }
            }
          }
        },
      },
    ],
    axes: [
      {
        grid: { show: false },
        ticks: { show: true, stroke: "#eee", width: 1, dash: [], size: 5 },
      },
      {
        grid: { show: true, stroke: "#eee", width: 1, dash: [] },
        ticks: { show: false },
      },
    ],
    scales: {
      y: {
        range: [minY * 0.9, maxY * 1.1],
      },
    },
  };
};

const initializePlot = () => {
  if (!plotContainer.value) return;

  const containerWidth = plotContainer.value.offsetWidth;
  const opts = createPlotOptions(props.config, containerWidth);
  if (plotInstance) {
    plotInstance.setSize({ width: containerWidth, height: plotHeight });
  } else {
    plotInstance = new uPlot(opts, typedData, plotContainer.value);
  }
};

onMounted(() => {
  nextTick(() => {
    initializePlot();
    window.addEventListener("resize", initializePlot);
  }).catch(() => {
    /* skip */
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", initializePlot);
  plotInstance?.destroy();
});
</script>

<style scoped>
.plot-container {
  width: 100%;
  height: auto;
}
:deep(.u-title) {
  font-family: inherit;
  font-weight: 200;
}
:deep(.u-legend *) {
  font-family: inherit;
  font-weight: 400;
}
:deep(.u-series td) {
  vertical-align: bottom;
}
</style>
