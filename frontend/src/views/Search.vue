<template>
<section id="fileTableContainer">
  <div id="sideBar">
    <span class="listTitle">Filter options</span><br>
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
  <div class="dateform">
    <label for="dateFrom">Date from</label><br>
    <input class="date" v-bind:class="{ 'error': dateFromError }" name="dateFrom" type="text" v-bind:value="dateFromString" @change="setDateFrom($event.target.value)" @focus="$event.target.select()">
    <v-date-picker locale="en" v-model="dateFrom" :popover="{ placement: 'bottom', visibility: 'click' }" :input-debounce="100" value="dateFrom" :available-dates="{end: dateTo}">
      <button class="calendar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class="w-4 h-4 fill-current">
          <path d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z" />
        </svg>
      </button>
    </v-date-picker>
  </div>

  <div class="dateform">
    <label for="dateTo">Date to</label><br>
    <input class="date" v-bind:class="{ 'error': dateToError }" name="dateTo" type="text" v-bind:value="dateToString" @change="setDateTo($event.target.value)" @focus="$event.target.select()">
    <v-date-picker locale="en" v-model="dateTo" :popover="{ placement: 'bottom', visibility: 'click' }" :input-debounce="100" :available-dates="{start: dateFrom, end: today}">
      <button class="calendar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class="w-4 h-4 fill-current">
          <path d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z" />
        </svg>
      </button>
    </v-date-picker>
  </div>
  </div>
  </div>

  <div id="fileTable">
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
      aria-controls="fileTable"
      align="center"
    ></b-pagination>
  </div>
</section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import VCalendar from 'v-calendar'
import axios, { AxiosRequestConfig } from 'axios'
import Multiselect from 'vue-multiselect'
import { Site } from '../../../backend/src/entity/Site'

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

  today = new Date()
  dateFrom = new Date('2019-02-02')
  dateTo = this.today
  dateFromError = false
  dateToError = false

  dateFromString = ''
  dateToString = ''

  created () {
    this.dateFromString = this.dateString(this.dateFrom)
    this.dateToString = this.dateString(this.dateTo)
    this.initView()
  }

  async initView() {
    const res = await axios.get(`${this.apiUrl}sites/`)
    this.siteOptions = res.data
    this.allSiteIds = res.data.map((d: Site) => d.id)
    this.fetchData({params: {location: this.allSiteIds, dateFrom: this.dateFrom, dateTo: this.dateTo}})
  }

  fetchData(payload: AxiosRequestConfig) {
    this.isBusy = true
    axios
      .get(`${this.apiUrl}files/`, payload)
      .then(res => {
        this.apiResponse = res
        this.isBusy = false
      })
      .catch(() => {
        this.apiResponse = this.resetResponse()
        this.isBusy = false
      })
  }

  sleep (time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  dateString (date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0,10)
  }
  setDateFrom (date: string) {
    this.dateFromString = date
    this.dateFrom = new Date(date)
  }
  setDateTo (date: string) {
    this.dateToString = date
    this.dateTo = new Date(date)
  }

  get listLength() {
    return this.apiResponse['data'][0]['uuid'] ? this.apiResponse['data'].length : 0
  }

  get captionText () {
    if (this.isBusy) return 'Searching...'
    return this.listLength > 0 ? 'Found ' + this.listLength + ' results' : 'No results'
  }

  resetResponse() {
    return {'data': [{'uuid': null, 'product': null}]}
  }

  clickRow(_: number, index: number) {
    this.$router.push('file/' + this.apiResponse.data[index].uuid)
  }

  setIcon(product: string) {
    if (product) return {'style': 'background-image: url(' + require('../assets/icons/' + product + '.png') + ')'}
  }

  isValidDate = (obj: Date) => !isNaN(obj.getDate())
  dateIsAfter = (a: Date, b: Date) => a > b

  @Watch('response')
  onListGenerated() {
    this.currentPage = 1
  }

  @Watch('selectedSites')
  onSiteSelected () {
    const sites = this.selectedSites.length > 0 ? this.selectedSites.map((d: Site) => d.id) : this.allSiteIds
    this.fetchData({params: {location: sites, dateFrom: this.dateFrom, dateTo: this.dateTo}})
  }

  @Watch('dateFrom')
  onDateFromChanged () {
    console.log(this.dateFrom)
    this.dateFromError = !this.isValidDate(this.dateFrom) || this.dateIsAfter(this.dateFrom, this.dateTo)
    if(this.dateFromError) return
    this.dateFromString = this.dateString(this.dateFrom)
    this.fetchData({params: {location: this.selectedSites.map((d: Site) => d.id), dateFrom: this.dateFrom, dateTo: this.dateTo}})
  }

  @Watch('dateTo')
  onDateToChanged () {
    this.dateToError = !this.isValidDate(this.dateTo) || this.dateIsAfter(this.dateFrom, this.dateTo)
    if(this.dateToError) return
    this.dateToString = this.dateString(this.dateTo)
    this.fetchData({params: {location: this.selectedSites.map((d: Site) => d.id), dateFrom: this.dateFrom, dateTo: this.dateTo}})
  }

}
</script>

<style lang="sass">
  @import "../sass/variables.sass"
  @import "~vue-multiselect/dist/vue-multiselect.min.css"

  #fileTableContainer
    display: flex
    justify-content: center
    flex-wrap: wrap

  #fileTable
    padding-left: 30px
    padding-right: 30px
    flex-grow: 0.2
    margin-top: 30px
    padding-bottom: 100px
    text-align: left

  #tableContent
    margin-top: 10px

  .listTitle
    color: gray
    font-size: 85%
    margin-bottom: 5px
    display: block

  #pagi
    margin-top: 30px
    .page-item.active .page-link
      background-color: $steel-warrior
      border-color: $steel-warrior
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

  #sideBar
    margin-top: 30px
    margin-right: 100px
    width: 300px

  .multiselect
    margin-bottom: 50px

  .multiselect__tags-wrap
    span, span i:hover
      color: black
      background-color: $steel-warrior

  .multiselect__element
    font-size: 90%
    span:hover
      color: black
    .multiselect__option--highlight
      color: black
      background-color: $steel-warrior
      span
        background-color: $steel-warrior
    .multiselect__option--selected
      background-color: #eeeeee
      span
        background-color: #eeeeee
        font-weight: normal
        color: #bbbbbb

  div.date
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 1em
    max-width: 100%

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
      border-style: inset
    &>svg
      color: black

  .dateform
    width: 100%
    overflow: hidden
    white-space: nowrap
  input.date
    width: 7.5em
    font-size: 0.9em

  input.error
    border-style: solid
    border-color: red
    border-width: 1px

  label
    font-size: 0.9em
    margin-bottom: 0
  label::after
    content: ':'


  #noRes
    font-size: 90%
    color: gray
</style>
