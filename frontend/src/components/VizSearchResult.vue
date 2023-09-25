<style lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
@import "@/sass/visualizations.sass"

main#vizSearchResults
  width: 100%
  margin-bottom: 7em
  padding-top: 2rem

  header
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 1em
.modeSelector
  display: flex
  span
    padding-right: 5px

.notfound
  margin-top: $filter-margin
  text-align: center

.switch
  position: relative
  display: inline-block
  width: 30px
  min-width: 30px
  height: 19px
  margin-top: 2px

.switch input
  opacity: 0
  width: 0
  height: 0

.slider
  position: absolute
  cursor: pointer
  top: 0
  left: 0
  right: 0
  bottom: 0
  background-color: #ccc
  -webkit-transition: .4s
  transition: .4s

.slider:before
  position: absolute
  content: ""
  height: 13px
  width: 13px
  left: 3px
  bottom: 3px
  background-color: white
  -webkit-transition: .4s
  transition: .4s

input:checked + .slider
  background-color: $blue-sapphire-light

input:focus + .slider
  box-shadow: 0 0 1px $blue-sapphire-light

input:checked + .slider:before
  -webkit-transform: translateX(11px)
  -ms-transform: translateX(11px)
  transform: translateX(11px)

.slider.round
  border-radius: 15px

.slider.round:before
  border-radius: 50%

#switchlabel
  font-size: 90%
  padding-right: 5px
  cursor: pointer

h3 > .rowtag
  margin-left: 1em
  padding: 0.4em
  font-size: 0.8em
  border-radius: 5px

.sourceFileLink
  color: inherit
  text-decoration: none

.experimental
  background-color: #EC9706
</style>

<template>
  <main id="vizSearchResults" :class="{ singleColumn: !comparisonView, opaque: isBusy }">
    <header>
      <h3>Visualizations for {{ humanReadableDate(date) }}</h3>
      <span v-if="isBusy" class="listTitle">Loading...</span>
      <div v-if="searchYieldedResults">
        <div class="modeSelector">
          <label for="checkbox_id" id="switchlabel">comparison view</label>
          <label class="switch">
            <input type="checkbox" id="checkbox_id" v-model="comparisonView" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </header>
    <section v-if="noSelectionsMade" class="notfound">
      Please make a selection in the search filters to display visualizations.
    </section>
    <section v-else-if="searchYieldedResults" class="vizContainer" :class="{ sideBySide: comparisonView }">
      <div
        v-for="(file, index) in apiResponse"
        :key="index"
        class="sourceFile"
        :class="{ paddedSourceFile: !comparisonView }"
      >
        <h3>
          <router-link
            :to="{ name: 'File', params: { uuid: file.sourceFileId } }"
            title="View data object"
            class="sourceFileLink"
          >
            {{ file.locationHumanReadable }}
            {{
              file.source !== null
                ? "shortName" in file.source
                  ? file.source.shortName
                  : file.source.humanReadableName
                : file.productHumanReadable
            }}
            <svg fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="60px" height="60px">
              <path
                d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
              />
            </svg>
          </router-link>
          <FileTags :response="file" />
        </h3>
        <div class="variables">
          <visualization
            v-for="viz in file.visualizations"
            :key="viz.s3key"
            class="variable"
            :data="viz"
            :maxMarginLeft="maxMarginLeft"
            :maxMarginRight="maxMarginRight"
            caption
          />
        </div>
      </div>
    </section>
    <section class="notfound" v-else>No visualizations were found with the selected parameters.</section>
  </main>
</template>

<script lang="ts" setup>
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";
import { humanReadableDate, notEmpty } from "@/lib";
import { ref, watchEffect, computed } from "vue";
import Visualization from "./ImageVisualization.vue";
import FileTags from "./FileTags.vue";

export interface Props {
  apiResponse: VisualizationResponse[];
  isBusy: boolean;
  date: Date;
  setWideMode: Function;
  noSelectionsMade: boolean;
}

const props = defineProps<Props>();

const comparisonView = ref(false);

const maxMarginRight = computed(() =>
  Math.max(
    ...props.apiResponse.flatMap((file) =>
      file.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginRight).filter(notEmpty),
    ),
  ),
);

const maxMarginLeft = computed(() =>
  Math.max(
    ...props.apiResponse.flatMap((file) =>
      file.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginLeft).filter(notEmpty),
    ),
  ),
);

const searchYieldedResults = computed(() => props.apiResponse.length > 0);

watchEffect(() => {
  props.setWideMode(comparisonView);
});
</script>
