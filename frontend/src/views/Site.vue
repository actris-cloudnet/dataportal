<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"
@import "../sass/spinner.sass"

.forcewrap
  flex-basis: 100%
  height: 0

#sitelanding .graph
  flex-grow: 1
  flex-basis: 0
  min-width: 600px

#sitelanding .details
  height: 100%

#sitemap .details
  padding: 0

#siteselect
  padding-top: 25px
  width: 250px

#reset
  cursor: pointer
  text-decoration: underline
  color: #bcd2e2
  margin-bottom: $filter-margin
  margin-top: 20px
  display: block

#instruments
  max-width: 650px

.warningnote
  margin: 1em 0 0
  border-color: #fff2ca
  background: #fffdee

.errornote
  border-color: #ffcaca;
  background: #fee;
</style>

<template>
  <main id="sitelanding" v-if="!error && response">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()" />
    <header>
      <h2>{{ response.humanReadableName }}</h2>
      <span>
        Measurement station<template v-if="response.country"> in {{ response.country }}</template
        >.
      </span>
    </header>
    <main class="infoBox">
      <section id="summary">
        <header>Summary</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd>
              {{ response.humanReadableName }}<template v-if="response.country">, {{ response.country }}</template>
            </dd>
            <template v-if="response.latitude != null && response.longitude != null">
              <dt>Coordinates</dt>
              <dd>{{ formatCoordinates(response.latitude, response.longitude) }}</dd>
            </template>
            <template v-if="response.altitude != null">
              <dt>Site altitude</dt>
              <dd>{{ response.altitude }} m</dd>
            </template>
            <dt>Last measurement</dt>
            <dd v-if="latestFile">{{ latestFile.measurementDate }}</dd>
            <dd class="notAvailable" v-else></dd>
          </dl>
        </section>
      </section>
      <section id="instruments">
        <header>Instruments</header>
        <section class="details">
          <div v-if="instrumentsStatus === 'loading'" class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
          <div class="detailslistNotAvailable" v-else-if="instrumentsStatus === 'error'">
            Failed to load instrument information.
          </div>
          <div v-else-if="instruments && instruments.length" class="detailslist">
            <span class="notice">
              The site has submitted data from the following instruments in the last
              {{ instrumentsFromLastDays }} days:<br />
            </span>
            <div v-for="(instrument, index) in instruments" :key="index" class="detailslistItem">
              <img alt="instrument icon" :src="instrument.icon" class="product" />
              <span v-if="instrument.pid">
                <a :href="instrument.pid">{{ instrument.name }}</a>
              </span>
              <span v-else>{{ instrument.name }}</span>
            </div>
            <div v-if="instrumentPidStatus === 'someMissing'" class="notice note warningnote">
              Some files were submitted without an instrument PID in the last 30 days.
            </div>
            <div v-if="instrumentPidStatus === 'allMissing'" class="notice note errornote">
              All files were submitted without an instrument PID in the last 30 days. Please consult
              <a href="https://docs.cloudnet.fmi.fi/api/data-upload.html">our documentation</a> to identify your
              instruments.
            </div>
          </div>
          <div class="detailslistNotAvailable" v-else>Instrument information not available.</div>
        </section>
      </section>
      <section id="sitemap" v-if="response.latitude != null && response.longitude != null">
        <header>Map</header>
        <section class="details">
          <Map
            v-if="!busy"
            :sites="[response]"
            :center="[response.latitude, response.longitude]"
            :zoom="5"
            :fullHeight="true"
            :key="mapKey"
          ></Map>
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>
      <div class="forcewrap"></div>

      <section id="product_availability" class="graph">
        <header>
          Product availability
          <template v-if="selectedProduct">({{ selectedProduct }})</template>
        </header>

        <section class="details" v-if="singleProductView">
          <ProductAvailabilityVisualizationSingle
            :site="siteid"
            :legend="true"
            :tooltips="true"
            :product="selectedProductId"
            :dataStatusParser="dataStatusParser"
          ></ProductAvailabilityVisualizationSingle>
        </section>
        <section class="details" v-else>
          <ProductAvailabilityVisualization
            v-if="dataStatusParser"
            :site="siteid"
            :legend="true"
            :tooltips="true"
            :dataStatusParser="dataStatusParser"
          ></ProductAvailabilityVisualization>
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>

      <section id="product_quality" class="graph">
        <header>
          Product quality
          <template v-if="selectedProduct">({{ selectedProduct }})</template>
        </header>

        <section class="details" v-if="singleProductView">
          <ProductAvailabilityVisualizationSingle
            :site="siteid"
            :legend="true"
            :tooltips="true"
            :product="selectedProductId"
            :qualityScores="true"
            :dataStatusParser="dataStatusParser"
          ></ProductAvailabilityVisualizationSingle>
        </section>

        <section class="details" v-else>
          <ProductAvailabilityVisualization
            v-if="dataStatusParser"
            :site="siteid"
            :legend="true"
            :tooltips="true"
            :qualityScores="true"
            :dataStatusParser="dataStatusParser"
          ></ProductAvailabilityVisualization>
          <div v-else class="loadingoverlay">
            <div class="lds-dual-ring"></div>
          </div>
        </section>
      </section>
    </main>

    <div v-if="dataStatusParser">
      <div id="siteselect">
        <custom-multiselect
          v-if="dataStatusParser"
          v-model="selectedProductId"
          :multiple="false"
          label="Product filter"
          :options="allProducts"
          id="singleProductSelect"
          :icons="true"
          :getIcon="getIconUrl"
        >
        </custom-multiselect>
      </div>
      <a @click="reset" id="reset">Reset filter</a>
    </div>
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
import ProductAvailabilityVisualizationSingle from "../components/DataStatusVisualizationSingleProduct.vue";
import { getProductIcon, formatCoordinates, fetchInstrumentName } from "../lib";
import { DevMode } from "../lib/DevMode";
import { Product } from "../../../backend/src/entity/Product";
import { DataStatusParser } from "../lib/DataStatusParser";
import CustomMultiselect from "../components/Multiselect.vue";
import { ReducedMetadataResponse } from "../../../backend/src/entity/ReducedMetadataResponse";

interface Instrument {
  pid: string | null;
  name: string;
  icon: string;
}

@Component({
  name: "app-site",
  components: { Map, ProductAvailabilityVisualization, CustomMultiselect, ProductAvailabilityVisualizationSingle },
})
export default class SiteView extends Vue {
  @Prop() siteid!: string;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  response: Site | null = null;
  latestFile: SearchFileResponse | null = null;
  error = false;
  instruments: Instrument[] = [];
  instrumentsFromLastDays = 30;
  instrumentsStatus: "loading" | "error" | "ready" = "loading";
  allProducts: Product[] | null = null;
  selectedProductId: string | null = null;
  mapKey = 0;
  busy = false;
  getIconUrl = getProductIcon;
  formatCoordinates = formatCoordinates;
  devMode = new DevMode();
  dataStatusParser: DataStatusParser | null = null;
  payload = { developer: this.devMode.activated };

  created() {
    axios
      .get(`${this.apiUrl}products/`)
      .then(({ data }) => {
        this.allProducts = data.filter((product: Product) => product.level != "3");
      })
      .catch(() => {
        /* */
      });
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
      .catch(() => {
        /* */
      });
    this.initDataStatusParser().catch(() => {
      /* */
    });
    this.loadInstruments().catch((error) => {
      console.error(error);
      this.instrumentsStatus = "error";
    });
  }

  get selectedProduct() {
    if (!this.selectedProductId || !this.allProducts) return null;
    const product = this.allProducts.find((product) => product.id === this.selectedProductId);
    if (!product) return null;
    return product.humanReadableName;
  }

  get singleProductView(): boolean {
    return this.selectedProductId != null;
  }

  reset() {
    this.selectedProductId = null;
  }

  async initDataStatusParser(product: string | null = null) {
    const properties = ["measurementDate", "productId", "legacy", "uuid", "errorLevel"];
    const payload = {
      site: this.siteid,
      showLegacy: true,
      developer: this.devMode.activated,
      product: product,
      properties,
    };
    this.dataStatusParser = await new DataStatusParser(payload).engage();
  }

  async handleInstrument(response: ReducedMetadataResponse): Promise<Instrument> {
    if (response.instrumentPid) {
      return {
        pid: response.instrumentPid,
        name: await fetchInstrumentName(response.instrumentPid).catch((error) => {
          console.error("Failed to load instrument information", error);
          return response.instrument.humanReadableName;
        }),
        icon: this.getIconUrl(response.instrument.type),
      };
    } else {
      return {
        pid: null,
        name: `Unidentified ${response.instrument.humanReadableName}`,
        icon: this.getIconUrl(response.instrument.type),
      };
    }
  }

  async loadInstruments() {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - this.instrumentsFromLastDays);
    const instruments = await axios.get(`${this.apiUrl}uploaded-metadata/`, {
      params: { ...this.payload, ...{ site: this.siteid, dateFrom } },
    });
    this.instruments = await Promise.all(instruments.data.map(this.handleInstrument));
    this.instrumentsStatus = "ready";
  }

  get instrumentPidStatus(): "ok" | "someMissing" | "allMissing" {
    const okCount = this.instruments.reduce((count, instrument) => (instrument.pid ? count + 1 : count), 0);
    if (okCount == this.instruments.length) {
      return "ok";
    }
    if (okCount == 0) {
      return "allMissing";
    }
    return "someMissing";
  }
}
</script>
