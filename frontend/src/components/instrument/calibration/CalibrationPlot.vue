<template>
  <div ref="plotContainer" style="width: 100%"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

const props = defineProps<{
  data: (Uint8Array | Float64Array)[];
  config: {
    title: string;
    label: string;
    color: string;
  };
}>();

const plotContainer = ref<HTMLElement | null>(null);
let plotInstance: uPlot | null = null;

const createPlotOptions = (config: { title: string; label: string; color: string }, width: number): uPlot.Options => ({
  title: config.title,
  id: "calibration-plot",
  class: "calibration-plot",
  width: width,
  height: 400,
  tzDate: (ts) => uPlot.tzDate(new Date(ts * 1e3), "UTC"),
  series: [
    {
      value: "{YYYY}-{MM}-{DD}",
    },
    {
      label: config.label,
      stroke: config.color,
      width: 1,
      paths: uPlot.paths && uPlot.paths.stepped ? uPlot.paths.stepped({ align: 1 }) : undefined,
      points: {
        size: 10,
      },
      value: (self, v) => {
        if (v === null || v === undefined) {
          return "--";
        } else {
          if (Number.isInteger(v)) {
            return v.toString();
          } else {
            if (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3) {
              return v.toExponential(2);
            } else {
              return v.toFixed(2);
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
      ticks: { show: false, stroke: "#eee", width: 1, dash: [], size: 10 },
    },
  ],
});

const initializePlot = () => {
  if (!plotContainer.value) return;

  const containerWidth = plotContainer.value.offsetWidth;
  const opts = createPlotOptions(props.config, containerWidth);
  if (plotInstance) {
    plotInstance.setSize({ width: containerWidth, height: 400 });
  } else {
    plotInstance = new uPlot(opts, props.data, plotContainer.value);
  }
};

onMounted(() => {
  nextTick(() => {
    initializePlot();
    window.addEventListener("resize", initializePlot);
  });
});

watch(
  () => props.data,
  (newData) => {
    if (plotInstance) {
      plotInstance.setData(newData);
    }
  },
);

watch(
  () => props.config,
  () => {
    initializePlot();
  },
);

onUnmounted(() => {
  window.removeEventListener("resize", initializePlot);
  plotInstance?.destroy();
});
</script>

<style scoped>
.plotContainer {
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
