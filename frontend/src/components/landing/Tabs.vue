<style scoped lang="sass">
@import "../../sass/landing-beta.sass"

.tab
  position: relative

img
  width: 1rem
  height: 1rem !important
</style>

<template>
  <div class="tab-container">
    <div class="tab" :class="{ active: summaryActive }" @click="$emit('tabclicked', 'summary')">
      <img class="quality-icon" :src="getProductIcon(response.product.id)" alt="" />
      Summary
    </div>
    <div class="tab" :class="{ active: visualisationsActive }" @click="$emit('tabclicked', 'visualisations')">
      <img
        class="quality-icon"
        :src="require('../../assets/icons/icons8-eye-50.png')"
        alt=""
        style="transform: scale(1.3)"
      />
      Visualisations
    </div>
    <div class="tab" :class="{ active: qualityReportActive }" @click="$emit('tabclicked', 'qualityReport')">
      <img class="quality-icon" :src="getQcIcon(response.errorLevel)" alt="" />
      Quality report
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import Vue from "vue";
import { getProductIcon, getQcIcon } from "../../lib";

@Component
export default class Tabs extends Vue {
  @Prop() summaryActive!: boolean;
  @Prop() visualisationsActive!: boolean;
  @Prop() qualityReportActive!: boolean;
  @Prop() response!: ModelFile | RegularFile | null;
  @Prop() visualizations!: VisualizationItem[];
  getQcIcon = getQcIcon;
  getProductIcon = getProductIcon;
}
</script>
