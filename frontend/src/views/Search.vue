<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  main#search
    position: relative
    display: flex
    justify-content: center
    flex-wrap: wrap

  .betanote
    border-color: #ffeecf
    background: #fdfce5

  .rednote
    border-color: #ffcfcf
    background: #fde5e5

  .close
    float: right
    font-weight: bold
    color: lightgrey
    cursor: pointer
    margin-left: 1em

  .rednote>.close
    color: grey
    font-weight: normal

  .filterOptions
    font-size: 1.2em
    margin-bottom: $filter-margin

  section#sideBar
    margin-right: 80px
    width: 300px

  .multiselect
    margin-bottom: $filter-margin

  div.date
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 1em
    row-gap: 0.5em
    max-width: 100%
    margin-bottom: $filter-margin

  button.calendar
    width: 2em
    height: 2em
    background-color: $blue-dust
    color: white
    border-style: solid
    border-width: 1px
    border-color: $steel-warrior
    border-radius: 2px
    font-size: 1em
    cursor: pointer
    font-family: $content-font
    &:hover
      background-color: $steel-warrior
    &:active
      background-color: $steel-warrior
      border-color: $blue-dust
    &>svg
      color: black

  div.errormsg
    border-style: solid
    border-width: 1px
    border-radius: 2px
    grid-column: 1 / 3
    padding: 0.5em

  div.errormsg, .error>input
    border-color: #e4c7c7
    background: #f9ebea

  label
    font-size: 0.9em
    margin-bottom: 0
  label::after
    content: ':'

  #noRes
    font-size: 90%
    color: gray

  #reset
    cursor: pointer
    text-decoration: underline
    color: #bcd2e2
    margin-bottom: $filter-margin
    display: block

  .disabled
    opacity: 0.5

  .hidden
    display: none

  .multiselect--disabled
    .multiselect__select
      background: none

  .results
    display: inline-flex
    flex-basis: 600px

  .resultsWide
    flex-grow: 1

  .resultsNarrow
    flex-grow: 0.2

  .resultsViz
    flex-grow: 1
    max-width: 1000px

  .secondaryButton
    width: 100%
    margin: 0 auto
    margin-bottom: $filter-margin

  .map
    height: 100px
</style>

<template>
<main v-if="mode == 'visualizations' || mode == 'data'" id="search" v-bind:class="{ wide: isVizMode() }">
  <div v-if="displayBetaNotification" class="note betanote">
    This is the beta version of Cloudnet data portal.
    Click <a href="http://devcloudnet.fmi.fi/">here</a> to visit the devcloudnet data portal, or
    <a href="http://cloudnet.fmi.fi/index.html">here</a> to navigate to the legacy cloudnet site.
    <span class="close" @click="displayBetaNotification = !displayBetaNotification">&#10005;</span>
  </div>
  <div v-if="devMode.activated" class="note rednote">
    You are using the dataportal in developer mode. Files from sites in testing mode are now visible.
    <span class="close" id="disableDevMode" @click="devMode.disable()">Deactivate</span>
  </div>

  <section id="sideBar">
    <header class="filterOptions">Filter search</header>

    <div id="minimap" class="container">
      <div class="row">
        <div class="col-md-9">
          <div
            class="form-check"
            v-for="layer in layers"
            :key="layer.id"
          >
            <label class="form-check-label">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="layer.active"
                @change="layerChanged(layer.id, layer.active)"
              />
              {{ layer.name }}
            </label>
          </div>
          <div id="map" class="map">
          test
          </div>

        </div>
        <div class="col-md-3">
          <!-- The layer checkboxes go here -->
          lllll
        </div>
      </div>
    </div>



    <custom-multiselect
      label="Location"
      :selectedSiteIds="selectedSiteIds"
      :setSelectedSiteIds="setSelectedSiteIds"
      :options="allSites"
      id="siteSelect"
      :icons="false"
      :devMode="devMode">
    </custom-multiselect>

    <div class="date" v-if="!isVizMode()">
      <datepicker
        name="dateFrom"
        v-model="dateFrom"
        :start="beginningOfHistory"
        :end="dateTo"
        label="Date from"
        v-on:error="dateFromError = $event"
        :key="dateFromUpdate"
      ></datepicker>
      <datepicker
        name="dateTo"
        v-model="dateTo"
        :start="dateFrom"
        :end="today"
        label="Date to"
        v-on:error="dateToError = $event"
        :key="dateToUpdate"
      ></datepicker>
      <div v-if="!isTrueOnBothDateFields('isValidDateString')" class="errormsg">
        Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
      </div>
      <div
        v-if="isTrueOnBothDateFields('isValidDateString') && !isTrueOnBothDateFields('isNotInFuture')"
        class="errormsg"
      >Provided date is in the future.
      </div>
      <div v-if="isTrueOnBothDateFields('isValidDateString')
          && (!dateFromError.isBeforeEnd || !dateToError.isAfterStart)"
        class="errormsg"
      >Date from must be before date to.
      </div>
    </div>

    <div class="date" v-else>
      <datepicker
        name="dateTo"
        v-model="dateTo"
        :defaultVizDate="defaultVizDate"
        :start="beginningOfHistory"
        :end="today"
        label="Date"
        v-on:error="dateToError = $event"
        :key="vizDateUpdate"
      ></datepicker>
      <div v-if="!dateToError.isValidDateString" class="errormsg">
        Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
      </div>
      <div
        v-if="dateToError.isValidDateString && !dateToError.isNotInFuture"
        class="errormsg"
      >Provided date is in the future.
      </div>
    </div>

    <custom-multiselect
      label="Product"
      :selectedProductIds="selectedProductIds"
      :setSelectedProductIds="setSelectedProductIds"
      :options="allProducts"
      id="productSelect"
      :icons="true"
      :getIconUrl="getIconUrl"
      :devMode="devMode">
    </custom-multiselect>

    <custom-multiselect v-show="isVizMode()"
      label="Variable"
      v-model="selectedVariableIds"
      :options="selectableVariables"
      id="variableSelect">
    </custom-multiselect>

    <button v-if="isVizMode()" @click="navigateToSearch('data')" class="secondaryButton">
      View in data search &rarr;
    </button>
    <button v-else @click="navigateToSearch('visualizations')" class="secondaryButton">
      View latest date in visualization search &rarr;
    </button>

    <a @click="reset" id="reset">Reset filter</a>
  </section>

  <div class="results" v-bind:class="resultsWidth">
    <viz-search-result
      v-if="isVizMode()"
      :apiResponse="apiResponse"
      :isBusy="isBusy"
      :date="dateTo"
      :key="vizSearchUpdate"
      :setWideMode="setVizWideMode">
    </viz-search-result>

    <data-search-result
      v-else
      :apiResponse="apiResponse"
      :isBusy="isBusy"
      :downloadUri="downloadUri"
      :key="dataSearchUpdate">
    </data-search-result>
  </div>

</main>
<app-error v-else :response="{status: 404}"></app-error>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import VCalendar from 'v-calendar'
import axios from 'axios'
import { File } from '../../../backend/src/entity/File'
import { BTable } from 'bootstrap-vue/esm/components/table'
import { BPagination } from 'bootstrap-vue/esm/components/pagination'
import Datepicker from '../components/Datepicker.vue'
import CustomMultiselect from '../components/Multiselect.vue'
import DataSearchResult from '../components/DataSearchResult.vue'
import {getIconUrl, humanReadableSize, combinedFileSize, dateToString} from '../lib'
import { DevMode } from '../lib/DevMode'
import VizSearchResult from '../components/VizSearchResult.vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {Product} from '../../../backend/src/entity/Product'
import {ProductVariable} from '../../../backend/src/entity/ProductVariable'
import L from 'leaflet'
import * as Vue2Leaflet from 'vue2-leaflet'

Vue.component('datepicker', Datepicker)
Vue.component('b-table', BTable)
Vue.component('b-pagination', BPagination)
Vue.component('custom-multiselect', CustomMultiselect)
Vue.component('data-search-result', DataSearchResult)
Vue.component('viz-search-result', VizSearchResult)

Vue.use(VCalendar)

export interface Selection {
  id: string;
  humanReadableName: string;
}

@Component({name: 'app-search'})
export default class Search extends Vue {
  @Prop() mode!: string

  // api call
  apiUrl = process.env.VUE_APP_BACKENDURL
  apiResponse: File[] | Visualization[] = this.resetResponse()
  isBusy = false

  // site selector
  allSites = []
  selectedSiteIds: string[] = []

  setSelectedSiteIds(siteIds: []) {
    this.selectedSiteIds = siteIds
  }

  // dates
  beginningOfHistory = new Date('1970-01-01')
  today = new Date()
  dateTo = this.today
  dateFrom = this.isVizMode() ? this.today : new Date(new Date().getFullYear().toString())
  dateFromError: { [key: string]: boolean } = {}
  dateToError: { [key: string]: boolean } = {}
  defaultVizDate = this.dateTo

  // products
  allProducts: Product[] = []
  selectedProductIds: string[] = []

  setSelectedProductIds(productIds: []) {
    this.selectedProductIds = productIds
  }

  // variables
  selectedVariableIds: string[] = []
  get selectableVariables(): ProductVariable[] {
    if (this.selectedProductIds.length == 0)
      return this.allProducts.flatMap(prod => prod.variables)
    return this.allProducts
      .filter(prod => this.selectedProductIds.includes(prod.id))
      .flatMap(prod => prod.variables)
  }



  // Minimap
  map = null
  tileLayer = null
  layers = [{
    id: 0,
    name: 'Sites',
    active: true,
    features: [{
      id: 0,
      name: 'Mace Head',
      type: 'marker',
      coords: [53.326, -9.9],
    }],
  }]



  renderComplete = false

  displayBetaNotification = true

  getIconUrl = getIconUrl
  humanReadableSize = humanReadableSize
  combinedFileSize = combinedFileSize
  dateToString = dateToString
  devMode = new DevMode()

  vizWideMode = false

  // keys
  dateFromUpdate = 10000
  dateToUpdate = 20000
  vizDateUpdate = 30000
  dataSearchUpdate = 40000
  vizSearchUpdate = 50000

  isVizMode() {
    return this.mode == 'visualizations'
  }

  setVizWideMode(wide: boolean) {
    if (wide) this.vizWideMode = true
    else this.vizWideMode = false
  }

  get resultsWidth() {
    if (this.isVizMode()) {
      if (this.vizWideMode) return {resultsWide: true}
      else return { resultsViz: true }
    }
    return { resultsNarrow: true }
  }

  isTrueOnBothDateFields(errorId: string) {
    return (this.isVizMode() || this.dateFromError[errorId]) && this.dateToError[errorId]
  }

  created() {
    this.initView()
  }

  mounted() {
    // Wait until all child components have rendered
    this.$nextTick(() => {
      this.renderComplete = true
    })
    this.initMap()
    this.initLayers()
  }

  initMap() {
    this.map = L.map('map').setView([60.63, 20.23], 5)
    this.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',{
      maxZoom: 18,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>',
    })
    this.tileLayer.addTo(this.map)
  }

  initLayers()  {
    this.layers.forEach((layer) => {
      const markerFeatures = layer.features.filter(feature => feature.type === 'marker')
      const polygonFeatures = layer.features.filter(feature => feature.type === 'polygon')
      markerFeatures.forEach((feature) => {
        feature.leafletObject = L.marker(feature.coords).bindPopup(feature.name)
      })
      polygonFeatures.forEach((feature) => {
        feature.leafletObject = L.polygon(feature.coords).bindPopup(feature.name)
      })
    })
  }

  layerChanged(layerId, active) {
    const layer = this.layers.find(layer => layer.id === layerId)
    layer.features.forEach((feature) => {
      if (active) {
        feature.leafletObject.addTo(this.map)
      } else {
        feature.leafletObject.removeFrom(this.map)
      }
    })
  }

  alphabeticalSort = (a: Selection, b: Selection) => a.humanReadableName > b.humanReadableName

  async initView() {
    const payload = { params: { developer: this.devMode.activated || undefined } }
    Promise.all([
      axios.get(`${this.apiUrl}sites/`, payload),
      axios.get(`${this.apiUrl}products/variables`, payload)
    ]).then(([sites, products]) => {
      this.allSites = sites.data.sort(this.alphabeticalSort)
      this.allProducts = products.data.sort(this.alphabeticalSort)
      if (this.isVizMode()) {
        this.selectedSiteIds.push('bucharest')
        this.selectedProductIds.push('classification')
        const payload = { params: { location: 'bucharest' } }
        return axios.get(`${this.apiUrl}latest-visualization-date/`, payload)
          .then(res => {
            this.dateTo = res.data.date
            this.defaultVizDate = new Date(res.data.date)
          })
      }
    })
    return this.fetchData()
  }

  get payload() {
    return {
      params: {
        location: this.selectedSiteIds,
        dateFrom: this.isVizMode() ? this.dateTo : this.dateFrom,
        dateTo: this.dateTo,
        product: this.selectedProductIds,
        variable: this.isVizMode() ? this.selectedVariableIds : undefined,
        developer: this.devMode.activated || undefined
      }
    }
  }

  fetchData() {
    this.isBusy = true
    const apiPath = this.isVizMode() ? 'visualization/' : 'files/'
    return axios
      .get(`${this.apiUrl}${apiPath}`, this.payload)
      .then(res => {
        this.apiResponse = res.data
        this.isBusy = false
      })
      .catch(() => {
        this.apiResponse = this.resetResponse()
        this.isBusy = false
      })
  }

  get downloadUri() {
    return axios.getUri({...{ method: 'post', url: `${this.apiUrl}download/`}, ...this.payload })
  }

  resetResponse() {
    return []
  }

  navigateToSearch(mode: string) {
    this.$router.push({ name: 'Search', params: { mode }})
  }

  setIcon(product: string) {
    if (product) return {'style': `background-image: url(${getIconUrl(product)})`}
  }

  reset() {
    this.$router.go(0)
  }

  @Watch('selectedSiteIds')
  onSiteSelected() {
    this.fetchData()
  }

  @Watch('dateFrom')
  onDateFromChanged() {
    if (!this.renderComplete) return
    this.fetchData()
  }

  @Watch('dateTo')
  onDateToChanged() {
    if (!this.renderComplete) return
    if (this.isVizMode()) this.dateFrom = this.dateTo
    this.fetchData()
  }

  @Watch('selectedProductIds')
  onProductSelected() {
    this.fetchData()
  }

  @Watch('selectedVariableIds')
  onVariableSelected() {
    this.fetchData()
  }

  @Watch('devMode.activated')
  onDevModeToggled() {
    this.initView()
  }

  @Watch('mode')
  onModeChange() {
    this.renderComplete = false
    this.apiResponse = this.resetResponse()
    this.dateFromUpdate = this.dateFromUpdate += 1
    this.dateToUpdate = this.dateToUpdate += 1
    this.vizDateUpdate = this.vizDateUpdate += 1
    this.dataSearchUpdate = this.dataSearchUpdate += 1
    this.vizSearchUpdate = this.vizSearchUpdate += 1
    this.fetchData().then(() => this.renderComplete = true)
  }
}
</script>
