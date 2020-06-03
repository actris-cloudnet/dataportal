<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  main#vizSearchResults
    flex-grow: 1
    flex-basis: 600px
    margin-bottom: 7em
    header
      display: flex
      align-items: center
      justify-content: space-between
      margin-bottom: 1em
      height: 3em
      h3
        margin: 0
  main#vizSearchResults.singleColumn
    max-width: 1000px
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
      margin-bottom: 1.5em
      font-size: 1.1em
  .variable
    h4
      margin-left: 1.5em
      margin-bottom: 0

  .modeSelector
    display: flex
    align-content: baseline
    img
      width: 30px
      height: auto
      cursor: pointer
    input
      width: 2.5em

</style>


<template>
  <main id="vizSearchResults" v-bind:class="{ singleColumn: !comparisonViewAsBoolean }">
    <header>
      <h3>Visualizations from {{humanReadableDate}}</h3>
      <div>
        <label for="comparisonModeSelector">View mode</label>
        <div class="modeSelector">
          <img :src="require('../assets/icons/column.png')" class="smallimg" @click="comparisonView = '0'">
          <input v-on:change="comparisonView = $event.target.value" :value="comparisonView"
            type="range" id="comparisonModeSelector" name="comparisonModeSelector" min="0" max="1">
          <img :src="require('../assets/icons/columns.png')" class="smallimg" @click="comparisonView = '1'">
        </div>
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
import {humanReadableDate} from '../lib'

@Component
export default class DataSearchResult extends Vue {
  @Prop() apiResponse!: VisualizationResponse[]
  @Prop() isBusy!: boolean
  @Prop() date!: Date

  comparisonView = '0'

  get humanReadableDate() {
    return humanReadableDate(this.date.toString())
  }

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
