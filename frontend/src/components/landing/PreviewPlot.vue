<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <img :src="quicklookUrl + data.s3key" class="preview-img" />
</template>

<script lang="ts">
import { VisualizationItem } from "../../../../backend/src/entity/VisualizationResponse";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";

@Component
export default class PreviewPlot extends Vue {
  @Prop() data!: VisualizationItem;
  quicklookUrl = `${process.env.VUE_APP_BACKENDURL}download/image/`;
}
</script>
