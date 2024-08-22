<template>
  <main id="vizSearchResults" :class="{ singleColumn: !comparisonView, opaque: isBusy }">
    <header>
      <h3>Visualisations for {{ humanReadableDate(date) }}</h3>
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
      Please make a selection in the search filters to display visualisations.
    </section>
    <section v-else-if="error" class="notfound" style="color: red">Search failed: {{ error }}</section>
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
          <FileTags class="tags" :response="file" size="small" />
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
    <section class="notfound" v-else>No visualisations were found with the selected parameters.</section>
  </main>
</template>

<script lang="ts" setup>
import type { VisualizationResponse } from "@shared/entity/VisualizationResponse";
import { backendUrl, humanReadableDate, notEmpty } from "@/lib";
import { ref, watchEffect, computed, watch } from "vue";
import Visualization from "./ImageVisualization.vue";
import FileTags from "./FileTags.vue";
import axios from "axios";

export interface Props {
  setWideMode: Function;
  date: string;
  sites?: string[];
  products?: string[];
  instruments?: string[];
  instrumentPids?: string[];
  variables?: string[];
  defaultProducts?: string[];
  defaultSites?: string[];
}

const props = defineProps<Props>();

let requestController: AbortController | null = null;
const isBusy = ref(true);
const error = ref("");
const apiResponse = ref<VisualizationResponse[]>([]);

const noSelectionsMade = computed(
  () =>
    !(
      props.products?.length ||
      props.sites?.length ||
      props.variables?.length ||
      props.instruments?.length ||
      props.instrumentPids?.length
    ),
);

async function fetchData() {
  if (requestController) requestController.abort();
  requestController = new AbortController();

  if (noSelectionsMade.value) {
    isBusy.value = false;
    return;
  }

  isBusy.value = true;

  const payload = {
    site: props.sites?.length ? props.sites : props.defaultSites,
    date: props.date,
    product: props.products?.length ? props.products : props.defaultProducts,
    variable: props.variables,
    instrument: props.instruments,
    instrumentPid: props.instrumentPids,
    showLegacy: true,
    privateFrontendOrder: true,
  };

  try {
    const res = await axios.get(`${backendUrl}visualizations/`, { params: payload, signal: requestController!.signal });
    apiResponse.value = res.data;
    isBusy.value = false;
  } catch (err) {
    if (axios.isCancel(err)) return;
    console.error(err);
    error.value = (axios.isAxiosError(err) && err.response?.statusText) || "unknown error";
    isBusy.value = false;
  }
}

watch(
  () => [
    props.date,
    props.sites,
    props.instruments,
    props.instrumentPids,
    props.products,
    props.variables,
    props.defaultProducts,
    props.defaultSites,
  ],
  async (newValue, oldValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    await fetchData();
  },
  { immediate: true },
);

const comparisonView = ref(false);

const maxMarginRight = computed(() =>
  Math.max(
    ...apiResponse.value.flatMap((file) =>
      file.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginRight).filter(notEmpty),
    ),
  ),
);

const maxMarginLeft = computed(() =>
  Math.max(
    ...apiResponse.value.flatMap((file) =>
      file.visualizations.map((viz) => viz.dimensions && viz.dimensions.marginLeft).filter(notEmpty),
    ),
  ),
);

const searchYieldedResults = computed(() => apiResponse.value.length > 0);

watchEffect(() => {
  props.setWideMode(comparisonView);
});
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

$filter-margin: 2rem;
$column-spacing: 10px;

main#vizSearchResults {
  width: 100%;
  margin-bottom: 7em;
  padding-top: 2rem;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1em;
  }
}

.modeSelector {
  display: flex;

  span {
    padding-right: 5px;
  }
}

.notfound {
  margin-top: 2rem;
  color: gray;
}

.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  min-width: 30px;
  height: 19px;
  margin-top: 2px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
}

.slider::before {
  position: absolute;
  content: "";
  height: 13px;
  width: 13px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: $blue-sapphire-light;
}

input:focus + .slider {
  box-shadow: 0 0 1px $blue-sapphire-light;
}

input:checked + .slider:before {
  transform: translateX(11px);
}

.slider.round {
  border-radius: 15px;
}

.slider.round::before {
  border-radius: 50%;
}

#switchlabel {
  font-size: 90%;
  padding-right: 5px;
  cursor: pointer;
}

.sourceFileLink {
  color: inherit;
}

.tags {
  margin-left: 0.5rem;
}

div.sourceFile .variables {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(700px, 100%), 1fr));
  row-gap: 1rem;
}

div.paddedSourceFile + div.paddedSourceFile,
.sideBySide div.sourceFile:nth-child(n + 3) {
  border-top: 1px solid silver;
  padding-top: 1em;
  margin-top: $filter-margin;
}

.sideBySide {
  display: flex;
  flex-wrap: wrap;

  div.sourceFile {
    flex-basis: calc(50% - #{$column-spacing});
    align-content: flex-start;
    padding: 0;
    border: none;
    margin: 0;
  }

  div.sourceFile:nth-child(odd) {
    padding-right: calc($column-spacing/2);
  }

  div.sourceFile:nth-child(even) {
    padding-left: calc($column-spacing/2);
  }

  div.sourceFile:only-child {
    flex-basis: 100%;
  }
}

.sourceFile h3 {
  width: 100%;
  margin-bottom: 1.5em;
  font-size: 1.1em;

  svg {
    position: relative;
    top: -1px;
    width: 0.9em;
    height: auto;
  }
}
</style>
