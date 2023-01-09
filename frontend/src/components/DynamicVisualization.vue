<template>
  <svg ref="svgElement"></svg>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import * as d3 from "d3";

interface Variable {
  units: string;
  standard_name: string;
  dimensions: string[];
  data: any;
}

interface Props {
  data: Record<string, Variable>;
  variable: string;
}

const props = defineProps<Props>();

const svgElement = ref<HTMLElement | null>(null);

// https://observablehq.com/@d3/color-legend
function ramp(color: any, n = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return;
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1));
    context.fillRect(i, 0, 1, 1);
  }
  return canvas;
}

function draw(ctx: CanvasRenderingContext2D, data: any, x: any, y: any, color: any) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const d of data) {
    ctx.fillStyle = color(d.value);
    ctx.fillRect(x(d.x), y(d.y), x(d.x) - x(d.prevX) + 1, y(d.prevY) - y(d.y) + 1);
  }
}

onMounted(() => {
  if (!svgElement.value) return;

  // @ts-ignore
  const data = props.data[props.variable].data.flatMap((row, i) =>
    row
      .filter(isFinite)
      .map((value: any, j: any) => ({
        x: props.data.time.data[i],
        y: props.data.height.data[j],
        prevX: i > 0 ? props.data.time.data[i - 1] : 0,
        prevY: j > 0 ? props.data.height.data[j - 1] : 0,
        value,
      }))
      .filter((d: any) => d.x < 24 && d.y < 12)
  );

  const width = 700;
  const height = 250;
  const colorBarWidth = 10;
  const margin = { top: 50, right: 100, bottom: 50, left: 50, colorBar: 10 };

  const canvas = document.createElement("canvas");
  canvas.width = width - margin.left - margin.right - margin.colorBar - colorBarWidth;
  canvas.height = height - margin.top - margin.bottom;
  const context = canvas.getContext("2d");
  if (!context) return;

  const svg = d3.select(svgElement.value).attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain([0, 24])
    .rangeRound([0, width - margin.left - margin.right - margin.colorBar - colorBarWidth]);

  const y = d3
    .scaleLinear()
    // @ts-ignore
    .domain([0, 12])
    .rangeRound([height - margin.top - margin.bottom, 0]);

  const yColor = d3
    .scaleLinear()
    // @ts-ignore
    .domain(d3.extent(data, (d) => d.value))
    .rangeRound([height - margin.top - margin.bottom, 0]);

  // @ts-ignore
  const color = d3.scaleSequentialSqrt([0, d3.max(data, (d) => d.value)], d3.interpolateViridis);

  // g.selectAll("rect")
  //   .data(data)
  //   .join("rect")
  //   // @ts-ignore
  //   .attr("x", d => x(d.x))
  //   // @ts-ignore
  //   .attr("y", d => y(d.y))
  //   .attr("width", d => x(1) - x(0))
  //   // @ts-ignore
  //   .attr("height", d => y(d.prevY) - y(d.y))
  //   // @ts-ignore
  //   .attr("fill", d => color(d.value))
  //   .attr("shape-rendering", "crispEdges")
  //   .attr("style", "shape-rendering:crispEdges");

  draw(context, data, x, y, color);
  g.append("image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", canvas.width)
    .attr("height", canvas.height)
    .attr("preserveAspectRatio", "none")
    .attr("image-rendeing", "crisp-edges")
    .attr("image-rendering", "optimizeSpeed")
    .style("image-rendering", "pixelated")
    .attr("xlink:href", canvas.toDataURL());

  g.append("g")
    .attr("transform", `translate(0, ${height - margin.top - margin.left})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  g.append("g")
    .call(d3.axisRight(yColor))
    .attr("transform", `translate(${width - margin.right}, 0)`);

  // @ts-ignore
  const n = Math.min(color.domain().length, color.range().length);
  svg
    .append("image")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", height - margin.top - margin.bottom)
    .attr("height", colorBarWidth)
    .attr("preserveAspectRatio", "none")
    // @ts-ignore
    .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL())
    .attr("transform", `translate(${width - margin.right /*- colorBarWidth*/}, ${margin.top})rotate(90)`);
});
</script>
