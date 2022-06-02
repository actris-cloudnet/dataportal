<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"
@import "../sass/spinner.sass"

.forcewrap
  flex-basis: 100%
  height: 0

#product_availability
  flex-grow: 0.7

#sitelanding .details
  height: 100%

#sitemap .details
  padding: 0
</style>

<template>
  <main id="sitelanding" v-if="!error && response">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()" />
    <header>
      <h2>{{ response.humanReadableName }}</h2>
      <span>Measurement station in {{ response.country }}.</span>
    </header>
    <main class="info">
      <section id="product_availability">
        <header>Data quality</header>
        <section class="details">
          <ProductAvailabilityVisualization
            :site="siteid"
            :loadingComplete="loadingComplete"
            :legend="true"
            :tooltips="true"
            :quality-scores="true"
          ></ProductAvailabilityVisualization>
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import axios from "axios";
import { Site } from "../../../backend/src/entity/Site";
import { SearchFileResponse } from "../../../backend/src/entity/SearchFileResponse";
import Map from "../components/Map.vue";
import ProductAvailabilityVisualization from "../components/DataStatusVisualization.vue";
import { ReducedMetadataResponse } from "../../../backend/src/entity/ReducedMetadataResponse";
import { getProductIcon } from "../lib";
import { DevMode } from "../lib/DevMode";

@Component({
  components: { Map, ProductAvailabilityVisualization },
})
export default class SiteView extends Vue {
  @Prop() siteid!: string;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  response: Site | null = null;
  latestFile: SearchFileResponse | null = null;
  error = false;
  instruments: ReducedMetadataResponse[] | null = null;
  instrumentsFromLastDays = 30;
  mapKey = 0;
  busy = true;
  getIconUrl = getProductIcon;
  devMode = new DevMode();

  payload = { developer: this.devMode.activated };
  created() {
    axios
      .get(`${this.apiUrl}sites/${this.siteid}`, { params: this.payload })
      .then(({ data }) => (this.response = data))
      .catch(({ response }) => {
        this.error = true;
        this.response = response;
      });
    axios
      .get(`${this.apiUrl}search/`, {
        params: {
          ...this.payload,
          ...{ site: this.siteid, product: ["radar", "lidar", "mwr"], limit: 1 },
        },
      })
      .then(({ data }) => (this.latestFile = data[0]))
      .catch();
    const date30daysago = new Date();
    date30daysago.setDate(date30daysago.getDate() - this.instrumentsFromLastDays);
    axios
      .get(`${this.apiUrl}uploaded-metadata/`, {
        params: { ...this.payload, ...{ site: this.siteid, dateFrom: date30daysago } },
      })
      .then(({ data }) => (this.instruments = data))
      .catch();
  }

  loadingComplete() {
    this.busy = false;
  }
}
</script>
