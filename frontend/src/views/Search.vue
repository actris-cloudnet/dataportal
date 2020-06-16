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
    height: 300px
    width: 300px
    margin-bottom: $filter-margin

  .wrapper
    position: relative

  .no-padding
    padding: 0

</style>

<template>
<main v-if="mode == 'visualizations' || mode == 'data'" id="search" v-bind:class="{ wide: isVizMode() }">
  <div v-if="displayBetaNotification" class="note betanote">
    This is the beta version of Cloudnet data portal.
    Click <a href="http://devcloudnet.fmi.fi/">here</a> to visit the devcloudnet data portal, or
    <a href="http://legacy.cloudnet.fmi.fi/index.html">here</a> to navigate to the legacy cloudnet site.
    <span class="close" @click="displayBetaNotification = !displayBetaNotification">&#10005;</span>
  </div>
  <div v-if="devMode.activated" class="note rednote">
    You are using the dataportal in developer mode. Files from sites in testing mode are now visible.
    <span class="close" id="disableDevMode" @click="devMode.disable()">Deactivate</span>
  </div>

  <section id="sideBar">
    <header class="filterOptions">Filter search</header>

    <div id="map" ref="mapElement" class="container wrapper" style="z-index: 4">
      <div class="row">
        <div class="col-md-12 no-padding">
          <div id="map" class="map"></div>
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
import { Site } from '../../../backend/src/entity/Site'
import { BTable } from 'bootstrap-vue/esm/components/table'
import { BPagination } from 'bootstrap-vue/esm/components/pagination'
import Datepicker from '../components/Datepicker.vue'
import CustomMultiselect from '../components/Multiselect.vue'
import DataSearchResult from '../components/DataSearchResult.vue'
import { dateToString, getIconUrl, getShadowUrl, getMarkerUrl, humanReadableSize, combinedFileSize } from '../lib'
import { DevMode } from '../lib/DevMode'
import VizSearchResult from '../components/VizSearchResult.vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {Product} from '../../../backend/src/entity/Product'
import {ProductVariable} from '../../../backend/src/entity/ProductVariable'
import L, { marker } from 'leaflet'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'

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
  apiResponse: SearchFileResponse[] | Visualization[] = this.resetResponse()

  // file list
  sortBy = 'title'
  sortDesc = false
  isBusy = false

  // site selector
  allSites: Site[] = []
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

  // map
  map: L.Map | null = null
  tileLayer: L.TileLayer | null = null
  allMarkers: { [key: string]: L.Marker } = {}
  passiveMarker = L.Icon.extend({
    options: {
      iconUrl: getMarkerUrl('blue'),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: getShadowUrl(),
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    }
  })
  activeMarker = L.Icon.extend({
    options: {
      iconUrl: getMarkerUrl('green'),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: getShadowUrl(),
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    }
  })

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
  }

  initMap() {
    this.map = L.map(this.$refs['mapElement'] as HTMLElement).setView([54.00, 14.00], 3)
    this.tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png')
    this.tileLayer.addTo(this.map)
  }

  initLayers()  {
    const markerNames = this.allSites.map(site => site.humanReadableName)
    const lat = this.allSites.map(site => site.latitude)
    const lon = this.allSites.map(site => site.longitude)
    const id = this.allSites.map(site => site.id)
    markerNames.forEach((name, i) => {
      const mark = marker([lat[i], lon[i]])
      mark.setIcon(new this.passiveMarker)
      mark.on('click', (_onClick) => {
        this.onMapMarkerClick(id[i])
      })
      this.allMarkers[id[i]] = mark
      if (!this.map) return
      mark.addTo(this.map)
    })
  }

  onMapMarkerClick(id: string) {
    if (this.selectedSiteIds.includes(id)) {
      this.selectedSiteIds = this.selectedSiteIds.filter(e => e !== id)
    }
    else {
      this.selectedSiteIds.push(id)
    }
  }

  setActiveMarkers() {
    const keys = Object.keys(this.allMarkers)
    keys.forEach((id: string) => {
      const mark = this.allMarkers[id]
      if (this.selectedSiteIds.includes(id)) {
        mark.setIcon(new this.activeMarker)
      }
      else {
        mark.setIcon(new this.passiveMarker)
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
      this.initLayers()
      if (this.isVizMode()) {
        this.selectedSiteIds.push('bucharest')
        this.selectedProductIds.push('classification')
        const payload = { params: { location: this.selectedSiteIds, product: this.selectedProductIds } }
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

  constructTitle(files: SearchFileResponse[]) {
    return files.map(file => ({...file, title: `${file.product} file from ${file.site}`}))
  }

  fetchData() {
    this.isBusy = true
    const apiPath = this.isVizMode() ? 'visualization/' : 'search/'
    return axios
      .get(`${this.apiUrl}${apiPath}`, this.payload)
      .then(res => {
        this.apiResponse = this.constructTitle(res.data)
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
    this.setActiveMarkers()
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
