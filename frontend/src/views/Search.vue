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

  a:focus
    outline: thin dotted

  .rednote
    border-color: #ffcfcf
    background: #fde5e5

  .close
    float: right
    font-weight: bold
    color: lightgrey
    cursor: pointer
    margin-left: 1em

  .closeX
    float: right
    font-weight: bold
    color: lightgrey
    cursor: pointer
    margin-right: 0.5em

  .rednote>.close
    color: grey
    font-weight: normal

  .filterOptions
    font-size: 1.2em
    margin-bottom: $filter-margin

  section#sideBar
    margin-right: 80px
    width: 300px

  @media screen and (max-width: $narrow-screen)
    section#sideBar
      margin-right: 0

  .multiselect
    margin-bottom: $filter-margin

  div.date
    display: grid
    grid-template-columns: 42.5% 15% 42.5%
    justify-items: center
    row-gap: 0.5em
    margin-bottom: $filter-margin
    .date
      outline: none

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
    &:focus
      background-color: $steel-warrior
      outline: none
    &:hover
      background-color: $steel-warrior
    &:active
      background-color: $steel-warrior
      border-color: $blue-dust
    &>svg
      color: black

  div.keyInfo
    border-style: solid
    border-width: 0.5px
    border-radius: 2px
    grid-column: 1 / 8
    padding: 0.1em
    width: 100%
    border-color: $steel-warrior
    background: $blue-dust
    font-size: 85%
    color: grey
    .infoIcon
      opacity: 0.5
      height: 1.3em
      width: auto
      top: -1.5px
      position: relative
      margin-right: 0.5em
      margin-left: 0.7em

  div.errormsg
    border-style: solid
    border-width: 1px
    border-radius: 2px
    grid-column: 1 / 4
    padding: 0.5em
    width: 100%

  div.errormsg, .error>input
    border-color: #e4c7c7
    background: #f9ebea

  label, span.filterlabel
    font-size: 0.9em
    margin-bottom: 0
    &::after
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
    &:focus
      outline: thin dotted

  .no-padding
    padding: 0

  .quickselectors
    width: 100%
    height: 27px
    display: flex
    justify-content: space-between
    margin-bottom: 0.6em
    margin-top: 0.6em
    .quickBtn
      color: black
      height: 25px
      padding-left: 10px
      padding-right: 10px
      padding-top: 10px
      padding-bottom: 10px
      font-size: 80%
      line-height: 0
      margin-right: 0px
      border: 1px solid $steel-warrior
      border-radius: 3px
      background-color: $blue-dust
      &:hover
        background-color: $steel-warrior
      &:focus
        outline: thin dotted
      &:active
        outline: none
    .activeBtn
      background-color: $steel-warrior
      border: 1px solid darkgray
      &:focus
        outline: none

  .dateButtons
    width: 80%
    height: 32px
    display: flex
    margin-top: 1.5em
    margin-left: 8.0em
    .dateBtn:disabled
      background-color: none
      opacity: 0.5
    .dateBtn:hover:enabled
      background-color: $steel-warrior
    .dateBtn
      padding-left: 10px
      padding-right: 10px
      margin-right: 12px
      border: 1px solid $steel-warrior
      border-radius: 3px
      background-color: $blue-dust
      &:focus
        outline: thin dotted
      .dateIcon
        height: 1.5em
        width: auto
        margin-right: 1.5em
  span.centerlabel
    line-height: 30px
    font-size: 80%

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
    <span class="close_x" id="disableDevMode" @click="devMode.disable()">Deactivate</span>
  </div>

  <section id="sideBar">
    <header class="filterOptions">Filter search</header>

    <Map v-if="allSites && allSites.length > 0"
      :key="mapKey"
      :sites="allSites"
      :selectedSiteIds="selectedSiteIds"
      :onMapMarkerClick="onMapMarkerClick"
      :center="[54.00, 14.00]"
      :zoom="3">
    </Map>

    <custom-multiselect
      label="Location"
      :selectedIds="selectedSiteIds"
      :setSelectedIds="setSelectedSiteIds"
      :options="allSites"
      id="siteSelect"
      :icons="false"
      :devMode="devMode">
    </custom-multiselect>

    <span class="filterlabel" v-if="!isVizMode()">Date range</span>
    <div class="quickselectors" v-if="!isVizMode()">
      <button id="yearBtn" class="quickBtn"
        @click="setDateRangeForCurrentYear()"
        :class="{activeBtn: activeBtn == 'btn1' }">Current year</button>
      <button id="monthBtn" class="quickBtn"
        @click="setDateRange(29)"
        :class="{activeBtn: activeBtn == 'btn2' }">Last 30 days</button>
      <button id="weekBtn" class="quickBtn"
        @click="setDateRange(6)"
        :class="{activeBtn: activeBtn == 'btn3' }">Last 7 days</button>
    </div>

    <div class="date" v-if="!isVizMode()">
      <datepicker
        name="dateFrom"
        v-model="dateFrom"
        :dateInput="dateInputStart"
        :start="beginningOfHistory"
        :end="dateTo"
        v-on:error="dateFromError = $event"
        :key="dateFromUpdate"
      ></datepicker>
      <span class="centerlabel">&#8212;</span>
      <datepicker
        name="dateTo"
        v-model="dateTo"
        :dateInput="dateInputEnd"
        :start="dateFrom"
        :end="today"
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

    <div class="date" v-if="isVizMode()">
      <datepicker
        label="Date"
        name="dateTo"
        v-model="dateTo"
        :dateInput="visualizationDate"
        :start="beginningOfHistory"
        :end="today"
        v-on:error="dateToError = $event"
        :key="vizDateUpdate"
      ></datepicker>
      <div class="dateButtons">
        <button id="previousBtn" class="dateBtn" @click="setPreviousDate()"
        :disabled="setDateButtonActiveStatus('previous')">
          <img class="dateIcon" :src="getIconUrl('date-previous')">
        </button>
        <button id="nextBtn" class="dateBtn" @click="setNextDate()"
        :disabled="setDateButtonActiveStatus('next')">
          <img class="dateIcon" :src="getIconUrl('date-next')">
        </button>
      </div>
      <div v-if="displayKeyInfo" class="keyInfo">
        <img class="infoIcon" :src="getIconUrl('info')">
        Use arrow keys to change dates
        <span class="closeX" @click="displayKeyInfo = !displayKeyInfo"> &#10005; </span>
      </div>
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
      :selectedIds="selectedProductIds"
      :setSelectedIds="setSelectedProductIds"
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
import { dateToString, getIconUrl, humanReadableSize, combinedFileSize,
  fixedRanges, getDateFromBeginningOfYear, isSameDay} from '../lib'
import { DevMode } from '../lib/DevMode'
import VizSearchResult from '../components/VizSearchResult.vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {Product} from '../../../backend/src/entity/Product'
import {ProductVariable} from '../../../backend/src/entity/ProductVariable'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import Map from '../components/Map.vue'

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

@Component({name: 'app-search',
  components: {Map}
})
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
  dateFrom = this.isVizMode() ? this.today : this.getInitialDateFrom()
  dateFromError: { [key: string]: boolean } = {}
  dateToError: { [key: string]: boolean } = {}
  visualizationDate = this.dateTo
  dateInputStart = this.dateFrom
  dateInputEnd = this.dateFrom
  activeBtn = ''

  dateErrorsExist(dateError: { [key: string]: boolean }) {
    return !(dateError.isValidDateString && dateError.isAfterStart && dateError.isBeforeEnd &&
      dateError.isNotInFuture)
  }

  // products
  allProducts: Product[] = []
  selectedProductIds: string[] = []

  setSelectedProductIds(productIds: []) {
    this.selectedProductIds = productIds
  }

  getInitialDateFrom() {
    const date = new Date()
    return new Date(date.setDate(date.getDate() - fixedRanges.week))
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

  renderComplete = false

  displayBetaNotification = true
  displayKeyInfo = true

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
  mapKey = 60000

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
    this.addKeyPressListener()
  }

  onMapMarkerClick(id: string) {
    if (this.selectedSiteIds.includes(id)) {
      this.selectedSiteIds = this.selectedSiteIds.filter(e => e !== id)
    }
    else {
      this.selectedSiteIds.push(id)
    }
  }

  alphabeticalSort = (a: Selection, b: Selection) => a.humanReadableName > b.humanReadableName

  async initView() {
    const payload = { params: { developer: this.devMode.activated || undefined } }
    await Promise.all([
      axios.get(`${this.apiUrl}sites/`, payload),
      axios.get(`${this.apiUrl}products/variables`, payload)
    ]).then(([sites, products]) => {
      this.allSites = sites.data.sort(this.alphabeticalSort)
      this.allProducts = products.data.sort(this.alphabeticalSort)
      if (this.isVizMode()) {
        this.selectedSiteIds.push('bucharest')
        this.selectedProductIds.push('classification')
        const payload = { params: { location: this.selectedSiteIds, product: this.selectedProductIds } }
        return axios.get(`${this.apiUrl}latest-visualization-date/`, payload)
          .then(res => {
            this.dateTo = res.data.date
            this.visualizationDate = new Date(res.data.date)
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
    const apiPath = this.isVizMode() ? 'visualizations/' : 'search/'
    if (!this.isVizMode()) this.checkIfButtonShouldBeActive()
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

  setDateRange(n: number) {
    this.dateInputEnd = new Date()
    const date = new Date()
    date.setDate(date.getDate() - n)
    this.dateInputStart = date
  }

  setDateRangeForCurrentYear() {
    this.dateInputEnd = new Date()
    this.dateInputStart = getDateFromBeginningOfYear()
  }

  addKeyPressListener() {
    window.addEventListener('keydown',  e => {
      if (document.activeElement === null) {
        if (e.keyCode == 37) this.setPreviousDate()
        if (e.keyCode == 39) this.setNextDate()
      }
      else {
        const element = document.activeElement
        const input = 'INPUT'
        if (input != element.tagName) {
          if (e.keyCode == 37) this.setPreviousDate()
          if (e.keyCode == 39) this.setNextDate()
        }
      }
    })
  }

  setPreviousDate() {
    if (this.dateTo > this.beginningOfHistory) {
      const date = this.dateTo
      date.setDate(date.getDate() - 1)
      this.visualizationDate = date
      this.dateTo = date
    }
  }

  setNextDate() {
    if (!isSameDay(this.dateTo, new Date)) {
      const date = this.dateTo
      date.setDate(date.getDate() + 1)
      this.visualizationDate = date
      this.dateTo = date
    }
  }

  checkIfButtonShouldBeActive() {
    const oneDay = 24 * 60 * 60 * 1000
    const diffDays = Math.round(Math.abs((this.dateTo.valueOf() - this.dateFrom.valueOf()) / oneDay))
    const isDateToToday = isSameDay(this.dateTo, new Date())
    const isDateFromBeginningOfYear = isSameDay(new Date(this.dateFrom), getDateFromBeginningOfYear())
    if (isDateToToday && isDateFromBeginningOfYear) this.activeBtn = 'btn1'
    else if (isDateToToday && diffDays === fixedRanges.month) this.activeBtn = 'btn2'
    else if (isDateToToday && diffDays === fixedRanges.week) this.activeBtn = 'btn3'
    else this.activeBtn = ''
  }

  setDateButtonActiveStatus(name: string) {
    const isDateToday = isSameDay(this.visualizationDate, new Date())
    const isDateLatest = isSameDay(this.visualizationDate, this.beginningOfHistory)
    if (name == 'next') {
      if (isDateToday) return true
    }
    else {
      if (isDateLatest) return true
    }
    return false
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
    if (!this.renderComplete || this.dateErrorsExist(this.dateFromError)) return
    this.fetchData()
  }

  @Watch('dateTo')
  onDateToChanged() {
    if (!this.renderComplete || this.dateErrorsExist(this.dateToError)) return
    if (this.isVizMode()) {
      this.dateFrom = this.dateTo
      this.visualizationDate = new Date(this.dateTo)
    }
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
  async onDevModeToggled() {
    await this.initView()
    this.mapKey = this.mapKey + 1
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
