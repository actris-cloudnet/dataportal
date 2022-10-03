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
    <g v-for="(segment, index) in segments" :key="index">
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        :stroke="segment.color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="adjustedCircumference"
        :stroke-dashoffset="calculateStrokeDashOffset(segment)"
        fill="transparent"
        :transform="returnCircleTransformValue(segment)"
      />
      <text v-if="segmentBigEnough(segment)" text-anchor="middle" dy="3px" :x="segment.textX" :y="segment.textY">
        {{ percentageString(segment.value) }}
      </text>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";

export interface DonutData {
  value: number;
  color: string;
}

interface Segment {
  value: number;
  color: string;
  degrees: number;
  textX: number;
  textY: number;
}

function angleToRadians(angle: number): number {
  return (angle * Math.PI) / 180;
}

@Component
export default class Donut extends Vue {
  @Prop() data!: DonutData[];
  cx = 80;
  cy = 80;
  radius = 55;
  strokeWidth = 35;

  get segments(): Segment[] {
    const sumOfValues = this.data.reduce((sum, item) => sum + item.value, 0);
    if (sumOfValues === 0) return [];

    const output: Segment[] = [];
    let angleOffset = -90;
    this.data.forEach((item) => {
      if (item.value == 0) return;
      const value = item.value / sumOfValues;
      const textAngle = angleToRadians(angleOffset + (value * 360) / 2);
      const segment = {
        value,
        color: item.color,
        degrees: angleOffset,
        textX: this.radius * Math.cos(textAngle) + this.cx,
        textY: this.radius * Math.sin(textAngle) + this.cx,
      };
      output.push(segment);
      angleOffset += segment.value * 360;
    });

    return output;
  }

  calculateStrokeDashOffset(segment: Segment): number {
    const strokeDiff = segment.value * this.circumference;
    return this.circumference - strokeDiff;
  }

  get adjustedCircumference(): number {
    const gap = 1;
    return this.circumference - gap;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  percentageString(value: number): string {
    return `${Math.round(100 * value)}%`;
  }

  returnCircleTransformValue(segment: Segment): string {
    return `rotate(${segment.degrees}, ${this.cx}, ${this.cy})`;
  }

  segmentBigEnough(segment: Segment): boolean {
    return segment.value > 0.05;
  }
}
</script>
