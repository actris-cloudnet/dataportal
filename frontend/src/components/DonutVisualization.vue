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

<template>
  <svg viewBox="0 0 170 170">
    <g v-for="(segment, index) in segments()" :key="index">
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        :stroke="segment.color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="adjustedCircumference()"
        :stroke-dashoffset="calculateStrokeDashOffset(segment)"
        fill="transparent"
        :transform="returnCircleTransformValue(segment)"
      />
      <text
        v-if="segmentBigEnough(segment)"
        text-anchor="middle"
        dy="3px"
        :x="segment.textX"
        :y="segment.textY"
      >
        {{ percentageString(segment.value) }}
      </text>
    </g>
  </svg>
</template>

<script lang="ts" setup>
export interface DonutData {
  value: number;
  color: string;
}

export interface Props {
  data: DonutData[];
}

interface Segment {
  value: number;
  color: string;
  degrees: number;
  textX: number;
  textY: number;
}

const props = defineProps<Props>();

function angleToRadians(angle: number): number {
  return (angle * Math.PI) / 180;
}

const cx = 80;
const cy = 80;
const radius = 55;
const strokeWidth = 35;

function segments(): Segment[] {
  const sumOfValues = props.data.reduce((sum, item) => sum + item.value, 0);
  if (sumOfValues === 0) return [];

  const output: Segment[] = [];
  let angleOffset = -90;
  props.data.forEach((item) => {
    if (item.value == 0) return;
    const value = item.value / sumOfValues;
    const textAngle = angleToRadians(angleOffset + (value * 360) / 2);
    const segment = {
      value,
      color: item.color,
      degrees: angleOffset,
      textX: radius * Math.cos(textAngle) + cx,
      textY: radius * Math.sin(textAngle) + cx,
    };
    output.push(segment);
    angleOffset += segment.value * 360;
  });

  return output;
}

function circumference(): number {
  return 2 * Math.PI * radius;
}

function calculateStrokeDashOffset(segment: Segment): number {
  const strokeDiff = segment.value * circumference();
  return circumference() - strokeDiff;
}

function adjustedCircumference(): number {
  const gap = 1;
  return circumference() - gap;
}

function percentageString(value: number): string {
  return `${Math.round(100 * value)}%`;
}

function returnCircleTransformValue(segment: Segment): string {
  return `rotate(${segment.degrees}, ${cx}, ${cy})`;
}

function segmentBigEnough(segment: Segment): boolean {
  return segment.value > 0.05;
}
</script>