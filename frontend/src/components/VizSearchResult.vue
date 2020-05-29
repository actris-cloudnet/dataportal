<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  section#vizContainer
    max-width: 900px

  div.sourceFile + div.sourceFile
    border-top: 1px solid $border-color
    padding: 1em
    margin-top: $filter-margin
  img
    height: auto
    max-width: 100%

</style>


<template>
  <section id="vizContainer">
    <div v-for="(file, index) in apiResponse" :key="index" class="sourceFile">
      <h3>{{ file.locationHumanReadable }} / {{ file.productHumanReadable }}</h3>
      <img v-for="viz in file.visualizations" :src="quicklookUrl + viz.filename" :key="viz.filename"><br>
    </div>
  </section>
</template>


<script lang="ts">
import {Component, Prop, Watch} from 'vue-property-decorator'
import Vue from 'vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {VisualizationResponse} from '../../../backend/src/entity/VisualizationResponse'

@Component
export default class DataSearchResult extends Vue {
  @Prop() apiResponse!: VisualizationResponse[]
  @Prop() isBusy!: boolean

  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL

}
</script>
