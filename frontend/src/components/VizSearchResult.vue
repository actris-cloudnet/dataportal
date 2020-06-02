<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  main#vizSearchResults
    flex-grow: 1
    flex-basis: 600px
    max-width: 1000px
    margin-bottom: 7em
  div.sourceFile
    padding-left: 1em
    padding-right: 1em
    padding-bottom: 1em
  div.paddedSourceFile + div.paddedSourceFile
    border-top: 1px solid $border-color
    padding-top: 1em
    margin-top: $filter-margin
  .sideBySide
    display: flex
    flex-wrap: wrap
  .sideBySide
    div.sourceFile
      flex-basis: 50%
      padding: 0
      border: none
      margin: 0
  img
    height: auto
    max-width: 100%
  .sourceFile
    h3
      display: inline-block
      margin-bottom: 1.5em
  .variable
    h4
      display: inline-block
      margin-left: 1.5em
      margin-bottom: 0

  .modeSelector
    display: flex
    align-content: baseline
    margin-bottom: $filter-margin
    margin-top: 0.5em
    img
      width: 30px
      height: auto
      cursor: pointer
    input
      width: 2.5em

</style>


<template>
  <main id="vizSearchResults">
    <header>
    <label for="comparisonModeSelector">View mode</label>
    <div class="modeSelector">
      <img :src="require('../assets/icons/column.png')" class="smallimg" @click="comparisonView = 0">
      <input v-model="comparisonView" type="range" id="comparisonModeSelector" name="volume"
             min="0" max="1">
      <img :src="require('../assets/icons/columns.png')" class="smallimg" @click="comparisonView = 1">
    </div>
    </header>
    <section class="vizContainer" v-bind:class="{ sideBySide: comparisonViewAsBoolean }">
    <div v-for="(file, index) in sortedApiResponse" :key="index" class="sourceFile"
      v-bind:class="{ paddedSourceFile: !comparisonViewAsBoolean }">
      <h3>{{ file.locationHumanReadable }} / {{ file.productHumanReadable }}</h3>
      <div v-for="viz in sortVisualizations(file.visualizations)"
        :key="viz.filename" class="variable">
        <h4>{{ viz.productVariable.humanReadableName }}</h4>
        <img :src="quicklookUrl + viz.filename"><br>
      </div>
    </div>
    </section>
  </main>
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

  comparisonView = 0


  get comparisonViewAsBoolean(): boolean {
    return parseInt(this.comparisonView) ? true : false
  }
  get sortedApiResponse() {
    return this.apiResponse.sort(this.alphabeticalSort)
  }

  sortVisualizations(visualizations: Visualization[]) {
    return visualizations.sort((a: Visualization, b: Visualization) => {
      if (a.productVariable.order == b.productVariable.order) return 0
      if (a.productVariable.order < b.productVariable.order) return -1
      return 1
    })
  }

  alphabeticalSort(a: VisualizationResponse, b: VisualizationResponse) {
    if (a.productHumanReadable == b.productHumanReadable) {
      if (a.locationHumanReadable == b.locationHumanReadable) return 0
      if (a.locationHumanReadable < b.locationHumanReadable) return -1
      return 1
    }
    if (a.productHumanReadable < b.productHumanReadable) return -1
    return 1
  }

  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL
}
</script>
