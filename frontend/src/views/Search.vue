<style lang="sass">
  @import "../sass/variables.sass"

  $filter-margin: 2em

  main#search
    display: flex
    justify-content: center
    flex-wrap: wrap

  section#fileTable
    padding-left: 30px
    padding-right: 30px
    flex-grow: 0.2
    padding-bottom: 100px
    text-align: left

  #tableContent
    margin-top: 10px

  .listTitle
    color: gray
    font-size: 85%
    margin-bottom: 5px
    display: block

  .filterOptions
    font-size: 1.2em
    margin-bottom: $filter-margin

  #pagi
    margin-top: 30px
    .page-item.active .page-link
      background-color: $steel-warrior
      border-color: $steel-warrior
    .page-link:hover
      background-color: $blue-dust
    .page-link
      color: $blue-sapphire

  .table-striped
    th:nth-child(1)
      width: 50px
      text-align: center
    th:nth-child(2)
      width: 400px
    th:nth-child(3)
      width: 110px
    td
      padding: 9px
    tr:nth-child(2n+1) > td
      background-color: $blue-dust
  .table-striped[aria-busy="false"]
    tr:hover td
      cursor: pointer
      background-color: #e4eff7

  .icon
    background-repeat: no-repeat
    background-position: center
    background-size: 20px
    font-size: 0

  section#sideBar
    margin-right: 100px
    width: 300px

  .multiselect
    margin-bottom: $filter-margin

  .multiselect__input
    padding: 2px
    padding-left: 0px
    &::placeholder
      font-size: 88%
      color: gray

  .multiselect__tags-wrap
    span, span i:hover
      color: black
      background-color: $steel-warrior

  .multiselect__element
    font-size: 90%
    color: black
    .multiselect__option--highlight
      color: black
      background-color: $steel-warrior
      span
        background-color: $steel-warrior
    .multiselect__option--selected
      background-color: white
      pointer-events: none
      span
        background-color: white
        font-weight: normal
        color: #bbbbbb

  .multiselect__tag-icon:after
    color: gray

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
</style>

<template>
<main id="search">
  <section id="sideBar">
    <header class="filterOptions">Filter search</header>
    <label for="siteSelect">Locations</label>
    <multiselect name="siteSelect" id="siteSelect"
      v-model="selectedSites"
      placeholder="Select"
      track-by="id"
      label="humanReadableName"
      :options="siteOptions"
      :show-labels="false"
      :multiple="true"
      :hideSelected="false"
    ><span id="noRes" slot="noResult">Not found</span>
    </multiselect>

    <div class="date">
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
      <div v-if="isTrueOnBothDateFields('isValidDateString') && !isTrueOnBothDateFields('isNotInFuture')" class="errormsg">
        Provided date is in the future.
      </div>
      <div v-if="isTrueOnBothDateFields('isValidDateString') && (!dateFromError.isBeforeEnd || !dateToError.isAfterStart)" class="errormsg">
        Date from must be before date to.
      </div>
    </div>

    <a @click="reset" id="reset">Reset filter</a>
  </section>

  <section id="fileTable">
    <span class="listTitle"> {{ captionText }} </span>
    <b-table id="tableContent" borderless small striped hover sort-icon-left
      :items="apiResponse.data"
      :fields="[
                { key: 'product', label: '', tdClass: 'icon', tdAttr: setIcon},
                { key: 'title', label: 'Data object', sortable: true},
                { key: 'measurementDate', label: 'Date', sortable: true},
                ]"
      :current-page="currentPage"
      :per-page="perPage"
      :busy="isBusy"
      @row-clicked="clickRow">
    </b-table>
    <b-pagination id="pagi" v-if="listLength > perPage"
      v-model="currentPage"
      :total-rows="listLength"
      :per-page="perPage"
      :disabled="isBusy"
      aria-controls="fileTable"
      align="center"
    ></b-pagination>
  </section>
</main>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import VCalendar from 'v-calendar'
import axios, { AxiosRequestConfig } from 'axios'
import Multiselect from 'vue-multiselect'
import { Site } from '../../../backend/src/entity/Site'
import { File } from '../../../backend/src/entity/File'
import { BTable } from 'bootstrap-vue/esm/components/table'
import { BPagination } from 'bootstrap-vue/esm/components/pagination'
import Datepicker from '../components/Datepicker.vue'

Vue.component('datepicker', Datepicker)
Vue.component('multiselect', Multiselect)
Vue.component('b-table', BTable)
Vue.component('b-pagination', BPagination)
Vue.component('multiselect', Multiselect)

Vue.use(VCalendar)

@Component
export default class Search extends Vue {

  // api call
  apiUrl = process.env.VUE_APP_BACKENDURL
  apiResponse = this.resetResponse()

  // file list
  sortBy = 'title'
  sortDesc = false
  isBusy = false
  currentPage = 1
  perPage = 25

  // site selector
  siteOptions = []
  selectedSites = []
  allSiteIds = []

  // dates
  beginningOfHistory = new Date('1970-01-01')
  today = new Date()
  dateFrom = new Date(new Date().getFullYear().toString())
  dateTo = this.today
  dateFromError: { [key: string]: boolean } = {}
  dateToError: { [key: string]: boolean } = {}

  renderComplete = false

  isTrueOnBothDateFields(errorId: string) {
    return this.dateFromError[errorId] && this.dateToError[errorId]
  }

  created() {
    this.initView()
  }

  mounted() {
    // Wait until all child components have rendered
    this.$nextTick(() => (this.renderComplete = true))
  }

  async initView() {
    const res = await axios.get(`${this.apiUrl}sites/`)
    this.siteOptions = res.data
    this.allSiteIds = res.data.map((d: Site) => d.id)
    this.fetchData()
  }

  get payload() {
    const sites = this.selectedSites.length > 0 ? this.selectedSites.map((d: Site) => d.id) : this.allSiteIds
    return {params: {location: sites, dateFrom: this.dateFrom, dateTo: this.dateTo}}
  }

  fetchData() {
    this.currentPage = 1
    this.isBusy = true
    axios
      .get(`${this.apiUrl}files/`, this.payload)
      .then(res => {
        this.apiResponse = res
        this.isBusy = false
      })
      .catch(() => {
        this.apiResponse = this.resetResponse()
        this.isBusy = false
      })
  }

  get listLength() {
    return this.apiResponse['data'][0]['uuid'] ? this.apiResponse['data'].length : 0
  }

  get captionText() {
    if (this.isBusy) return 'Searching...'
    return this.listLength > 0 ? `Found ${this.listLength} results` : 'No results'
  }

  resetResponse() {
    return {'data': [{'uuid': null, 'product': null}]}
  }

  clickRow(record: File) {
    if (this.listLength > 0) this.$router.push(`file/${record.uuid}`)
  }

  setIcon(product: string) {
    if (product) return {'style': `background-image: url(${require(`../assets/icons/${product}.png`)})`}
  }

  reset() {
    this.$router.go(0)
  }

  @Watch('selectedSites')
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
    this.fetchData()
  }

}
</script>
