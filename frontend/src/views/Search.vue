<template>
  <section id="fileTableContainer">

   <div id="sideBar">
     <span class="listTitle">Filter options</span>
      <multiselect id="siteSelect"
      v-model="selectedSites"
      placeholder="Location"
      :options="siteOptions"
      track-by="id"
      label="humanReadableName"
      :show-labels="false"
      :multiple="true"
      :hideSelected="false"
      ></multiselect>
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
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      :current-page="currentPage"
      :per-page="perPage"
      :busy="isBusy"
      @row-clicked="clickRow">
      <template v-slot:table-busy>
        <div class="text-center text-danger">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>
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
import axios, { AxiosRequestConfig } from 'axios'
import Multiselect from 'vue-multiselect'
import { Site } from '../../../backend/src/entity/Site'

Vue.component('multiselect', Multiselect)

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

  created () {
    this.initView()
  }

  async initView() {
    const res = await axios.get(`${this.apiUrl}sites/`)
    this.siteOptions = res.data
    this.allSiteIds = res.data.map((d: Site) => d.id)
    this.fetchData({params: {location: this.allSiteIds}})
  }

  fetchData(payload: AxiosRequestConfig) {
    this.isBusy = true
    this.sleep(500).then(() => { // remove me for production
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
    )}

  sleep (time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
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

  @Watch('response')
  onListGenerated() {
    this.currentPage = 1
  }

  @Watch('selectedSites')
  onSiteSelected () {
    const sites = this.selectedSites.length > 0 ? this.selectedSites.map((d: Site) => d.id) : this.allSiteIds
    this.fetchData({params: {location: sites}})
  }

}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style lang="sass">
  @import "../sass/variables.sass"

  #fileTableContainer
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

  #fileTable
    margin-top: 30px;
    padding-bottom: 100px;
    text-align: left;

  #tableContent
    margin-top: 10px;

  .listTitle
    color: gray;
    font-size: 85%;

  #pagi
    margin-top: 30px;
    .page-item.active .page-link
      background-color: lightskyblue;
      border-color: lightsteelblue;
    .page-link
      color: $blue-sapphire;

  .table-striped
    th:nth-child(1)
      width: 50px;
      text-align: center;
    th:nth-child(2)
      width: 400px;
    th:nth-child(3)
      width: 110px;
    td
      padding: 9px;
    tr:nth-child(2n+1) > td
      background-color: $blue-dust;
    tr:hover td
      cursor: pointer;
      background-color: #e4eff7;

  .icon
    background-repeat: no-repeat;
    background-position: center;
    background-size: 20px;
    font-size: 0;

  #sideBar
    margin-top: 30px;
    margin-right: 100px;
    width: 300px;

  $blueShade: lightskyblue;

  .multiselect__tags-wrap
    span, span i:hover
      background-color: $blueShade;

  .multiselect__tag-icon i:hover
    background-color: $blueShade;

  .multiselect__element
    .multiselect__option--highlight
      background-color: $blueShade;
      span
        background-color: $blueShade;

</style>>
