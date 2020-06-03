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
    margin-right: 100px
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

  .multiselect--disabled
    .multiselect__select
      background: none

</style>

<template>
<main v-if="mode == 'viz' || mode == 'data'" id="search" v-bind:class="{ wide: isVizMode() }">
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
    <custom-multiselect
      label="Location"
      v-model="selectedSiteIds"
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
      ></datepicker>
      <datepicker
        name="dateTo"
        v-model="dateTo"
        :start="dateFrom"
        :end="today"
        label="Date to"
        v-on:error="dateToError = $event"
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
        :start="beginningOfHistory"
        :end="today"
        label="Date"
        v-on:error="dateToError = $event"
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
      v-model="selectedProductIds"
      :options="allProducts"
      id="productSelect"
      :icons="true"
      :devMode="devMode">
    </custom-multiselect>

    <custom-multiselect v-if="isVizMode()"
      label="Variable"
      v-model="selectedVariableIds"
      :options="selectableVariables"
      id="variableSelect">
    </custom-multiselect>

    <a @click="reset" id="reset">Reset filter</a>
  </section>

  <viz-search-result
    v-if="isVizMode()"
    :apiResponse="apiResponse"
    :isBusy="isBusy"
    :date="dateTo">
  </viz-search-result>

  <data-search-result
    v-else
    :apiResponse="apiResponse"
    :isBusy="isBusy"
    :downloadUri="downloadUri">
  </data-search-result>

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
import { DevMode } from '../lib/DevMode'
import VizSearchResult from '../components/VizSearchResult.vue'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {Product} from '../../../backend/src/entity/Product'
import {ProductVariable} from '../../../backend/src/entity/ProductVariable'

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
  apiPath = this.isVizMode() ? 'visualization/' : 'files/'
  apiResponse: File[] | Visualization[] = this.resetResponse()
  isBusy = false

  // site selector
  allSites = []
  selectedSiteIds = []

  // dates
  beginningOfHistory = new Date('1970-01-01')
  today = new Date()
  dateTo = this.today
  dateFrom = this.isVizMode() ? this.today : new Date(new Date().getFullYear().toString())
  dateFromError: { [key: string]: boolean } = {}
  dateToError: { [key: string]: boolean } = {}

  // products
  allProducts: Product[] = []
  selectedProductIds: string[] = []

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

  devMode = new DevMode()

  isVizMode() {
    return this.mode == 'viz'
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
    })
    this.fetchData()
  }

  get payload() {
    return {
      params: {
        location: this.selectedSiteIds,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        product: this.selectedProductIds,
        variable: this.isVizMode() ? this.selectedVariableIds : undefined,
        developer: this.devMode.activated || undefined
      }
    }
  }

  fetchData() {
    this.isBusy = true
    axios
      .get(`${this.apiUrl}${this.apiPath}`, this.payload)
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
}
</script>
