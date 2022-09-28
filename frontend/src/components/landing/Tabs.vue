<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="tab-container">
    <div class="tab" :class="{ active: summaryActive }" @click="$emit('tabclicked', 'summary')">Summary</div>
    <div class="tab" :class="{ active: visualisationsActive }" @click="$emit('tabclicked', 'visualisations')">
      Visualisations
    </div>
    <div class="tab" :class="{ active: qualityReportActive }" @click="$emit('tabclicked', 'qualityReport')">
      Quality report
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";

@Component
export default class Tabs extends Vue {
  @Prop() summaryActive!: boolean;
  @Prop() visualisationsActive!: boolean;
  @Prop() qualityReportActive!: boolean;
}
</script>
