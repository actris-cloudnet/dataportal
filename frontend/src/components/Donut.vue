<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

svg
  height: 180px
  width: 180px

text
  fill: white
  font-family: "Roboto", sans-serif
  font-size: .70rem
  font-weight: bold
</style>

<template id="donutTemplate">
  <svg viewBox="0 0 170 170">
    <g v-for="(value, index) in sortedValues" :key="index">
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        :stroke="colors[index]"
        :stroke-width="strokeWidth"
        :stroke-dasharray="adjustedCircumference()"
        :stroke-dashoffset="calculateStrokeDashOffset(value)"
        fill="transparent"
        :transform="returnCircleTransformValue(index)"
      />
      <text
        v-if="segmentBigEnough(value)"
        text-anchor="middle"
        dy="3px"
        :x="chartData[index].textX"
        :y="chartData[index].textY"
      >
        {{ percentageString(value) }}
      </text>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { QualityResponse } from "../views/QualityReport.vue";

interface Data {
  degrees: number;
  textX: number;
  textY: number;
}

@Component
export default class Donut extends Vue {
  @Prop() qualityResponse!: QualityResponse;
  angleOffset = -90;
  chartData: Data[] = [];
  colors = ["#4C9A2A", "goldenrod", "#cd5c5c"];
  cx = 80;
  cy = 80;
  radius = 55;
  strokeWidth = 35;
  sortedValues = this.getValues();

  created() {
    this.calculateChartData();
  }

  calculateChartData() {
    this.sortedValues.forEach((value) => {
      const [x, y] = this.calculateTextCoords(value, this.angleOffset);
      // start at -90deg so that the largest segment is perpendicular to top
      const data: Data = {
        degrees: this.angleOffset,
        textX: x,
        textY: y,
      };
      this.chartData.push(data);
      this.angleOffset = this.dataPercentage(value) * 360 + this.angleOffset;
    });
  }

  calculateTextCoords(value: number, angleOffset: number): number[] {
    const angle = (this.dataPercentage(value) * 360) / 2 + angleOffset;
    const radians = angle * (Math.PI / 180);
    return [this.radius * Math.cos(radians) + this.cx, this.radius * Math.sin(radians) + this.cy];
  }

  getValues(): number[] {
    const data = [];
    data.push(this.qualityResponse.tests - this.qualityResponse.warnings - this.qualityResponse.errors);
    if (this.qualityResponse.warnings > 0) {
      data.push(this.qualityResponse.warnings);
    }
    if (this.qualityResponse.errors > 0) {
      data.push(this.qualityResponse.errors);
    }
    return data;
  }

  calculateStrokeDashOffset(value: number): number {
    const circumference = this.circumference();
    const strokeDiff = this.dataPercentage(value) * circumference;
    return circumference - strokeDiff;
  }

  adjustedCircumference(): number {
    const gap = 1;
    return this.circumference() - gap;
  }

  circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  percentageString(value: number): string {
    return `${Math.round(this.dataPercentage(value) * 100)}%`;
  }

  dataPercentage(value: number): number {
    const sumOfValues = this.sortedValues.reduce((acc, val) => acc + val);
    return value / sumOfValues;
  }

  returnCircleTransformValue(index: number): string {
    return `rotate(${this.chartData[index].degrees}, ${this.cx}, ${this.cy})`;
  }

  segmentBigEnough(value: number): boolean {
    return Math.round(this.dataPercentage(value) * 100) > 5;
  }
}
</script>
