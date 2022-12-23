<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-visualisations-container">
    <svg ref="vizzz"></svg>
    <!-- <div v-if="visualizations.length > 0" class="visualisations-box">
      <div v-for="visualization in visualizations" :key="visualization.productVariable.id">
        <Visualization
          :data="visualization"
          :maxMarginLeft="maxMarginLeft"
          :maxMarginRight="maxMarginRight"
          :caption="true"
          :expandable="true"
        />
      </div>
    </div>
    <div v-else class="visualisations-box">No visualisations available.</div> -->
  </div>
</template>
<script lang="ts">
import axios from "axios";
import { Component, Prop, Vue } from "vue-property-decorator";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import Visualization from "../Visualization.vue";

import * as d3 from "d3";

@Component({ components: { Visualization } })
export default class LandingVisualisations extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() visualizations!: VisualizationItem[];

  async mounted() {
    if (!this.response) return;
    const res = await axios.get(`http://localhost:8000/${this.response.uuid}/${this.response.filename}`);
    // @ts-ignore
    const data: any = res.data.vwind.data.flatMap((row, i) =>
      row.filter(isFinite).map((value, j) => ({
        x: res.data.time.data[i],
        y: res.data.level.data[j],
        value,
      }))
    );

    const width = 800;
    const height = 500;
    const colorBarWidth = 10;
    const margin = { top: 50, right: 100, bottom: 50, left: 50, colorBar: 10 };
    const svg = d3
      .select(this.$refs["vizzz"] as HTMLElement)
      .attr("width", width)
      .attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleLinear()
      // @ts-ignore
      .domain(d3.extent(data, (d) => d.x))
      .rangeRound([0, width - margin.left - margin.right - margin.colorBar - colorBarWidth]);

    const y = d3
      .scaleLinear()
      // @ts-ignore
      .domain(d3.extent(data, (d) => d.y))
      .rangeRound([height - margin.top - margin.bottom, 0]);

    const yColor = d3
      .scaleLinear()
      // @ts-ignore
      .domain(d3.extent(data, (d) => d.value))
      .rangeRound([height - margin.top - margin.bottom, 0]);

    // @ts-ignore
    const color = d3.scaleSequentialSqrt([0, d3.max(data, (d) => d.value)], d3.interpolateRdYlBu);

    g.selectAll("rect")
      .data(data)
      .join("rect")
      // @ts-ignore
      .attr("x", (d) => x(d.x))
      // @ts-ignore
      .attr("y", (d) => y(d.y))
      .attr("width", x(1) - x(0))
      .attr("height", y(0) - y(1))
      // @ts-ignore
      .attr("fill", (d) => color(d.value));

    g.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.left})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));

    g.append("g")
      .call(d3.axisRight(yColor))
      .attr("transform", `translate(${width - margin.right}, 0)`);

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
      .attr("transform", `translate(${width - margin.right - colorBarWidth}, ${margin.top})rotate(90)`);
  }

  get maxMarginLeft() {
    let max = 0;
    for (const v of this.visualizations) {
      if (v.dimensions) {
        max = Math.max(max, v.dimensions.marginLeft);
      }
    }
    return max;
  }
  get maxMarginRight() {
    let max = 0;
    for (const v of this.visualizations) {
      if (v.dimensions) {
        max = Math.max(max, v.dimensions.marginRight);
      }
    }
    return max;
  }
}
</script>
