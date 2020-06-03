<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  $column-spacing: 10px

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
    display: flex
    flex-wrap: wrap
  div.paddedSourceFile + div.paddedSourceFile, .sideBySide div.sourceFile:nth-child(n+3)
    border-top: 1px solid $border-color
    padding-top: 1em
    margin-top: $filter-margin
  .sideBySide
    display: flex
    flex-wrap: wrap
  .sideBySide
    div.sourceFile
      flex-basis: calc(50% - #{$column-spacing})
      padding: 0
      border: none
      margin: 0
    div.sourceFile:nth-child(even)
      padding-left: $column-spacing
    div.sourceFile:only-child
      flex-basis: 100%
  img
    height: auto
    max-width: 100%
  .sourceFile
    h3
      width: 100%
      margin-bottom: 1.5em
      font-size: 1.1em
      cursor: pointer
      svg
        position: relative
        top: -1px
        width: 0.9em
        height: auto
  .variable
    flex-basis: 600px
    flex-grow: 1
    h4
      margin-left: 1.5em
      margin-bottom: 0.15em

  .modeSelector
    display: flex
    align-content: baseline
    img
      width: 30px
      height: auto
      cursor: pointer
    input
      width: 2.5em

  .notfound
    margin-top: $filter-margin
    text-align: center
</style>


<template>
  <main id="vizSearchResults" v-bind:class="{ singleColumn: !comparisonViewAsBoolean }">
    <header>
      <h3>Visualizations from {{humanReadableDate}}</h3>
      <div v-if="searchYieldedResults">
        <label for="comparisonModeSelector">View mode</label>
        <div class="modeSelector">
          <img :src="require('../assets/icons/column.png')" class="smallimg" @click="comparisonView = '0'">
          <input v-on:change="comparisonView = $event.target.value" :value="comparisonView"
            type="range" id="comparisonModeSelector" name="comparisonModeSelector" min="0" max="1">
          <img :src="require('../assets/icons/columns.png')" class="smallimg" @click="comparisonView = '1'">
        </div>
      </div>
    </header>
    <section v-if="searchYieldedResults" class="vizContainer" v-bind:class="{ sideBySide: comparisonViewAsBoolean }">
    <div v-for="(file, index) in sortedApiResponse" :key="index" class="sourceFile"
      v-bind:class="{ paddedSourceFile: !comparisonViewAsBoolean }">
      <h3 @click="navigateToFile(file.sourceFileId)" title="View data object">
        {{ file.locationHumanReadable }} / {{ file.productHumanReadable }}
        <svg
          fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="60px" height="60px"><path d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"/>
        </svg>
      </h3>
      <div v-for="viz in sortVisualizations(file.visualizations)"
        :key="viz.filename" class="variable">
        <h4>{{ viz.productVariable.humanReadableName }}</h4>
        <img :src="quicklookUrl + viz.filename"><br>
      </div>
    </div>
    </section>
    <section class="notfound" v-else>No visualizations were found with the selected parameters.</section>
  </main>
</template>


<script lang="ts">
import {Component, Prop, Watch} from 'vue-property-decorator'
import Vue from 'vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {VisualizationResponse} from '../../../backend/src/entity/VisualizationResponse'
import {humanReadableDate} from '../lib'
import router from '@/router'

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
  get searchYieldedResults() {
    return this.apiResponse.length > 0
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

  navigateToFile(uuid: string) {
    router.push({ name: 'File', params: { uuid } })
  }

  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL
}
</script>
