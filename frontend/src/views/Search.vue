<style lang="sass">
  @import "../sass/variables.sass"
  @import "../sass/global.sass"

  $filter-margin: 2em

  main#search
    position: relative
    display: flex
    justify-content: center
    flex-wrap: wrap

  .betanote
    border: 1px #ffeecf solid
    border-radius: 2px
    background: #fdfce5
    width: 100%
    padding-top: 0.5em
    padding-bottom: 0.5em
    padding-left: 1em
    padding-right: 1em
    margin-bottom: 2em

  .rednote
    border: 1px #ffcfcf solid
    border-radius: 2px
    background: #fde5e5
    width: 100%
    padding-top: 0.5em
    padding-bottom: 0.5em
    padding-left: 1em
    padding-right: 1em
    margin-bottom: 2em

  .close
    float: right
    font-weight: bold
    color: lightgrey
    cursor: pointer
    margin-left: 1em

  .rednote>.close
    color: grey
    font-weight: normal

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
    float: left
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
      width: 300px
    th:nth-child(3)
      width: 100px
    th:nth-child(4)
      width: 110px
    td
      padding: 9px
    tr:nth-child(2n+1) > td
      background-color: $blue-dust
    td:nth-child(3)
      text-align: center
  .table-striped[aria-busy="false"]
    tr:hover td
      cursor: pointer
      background-color: #e4eff7

  .icon
    background-repeat: no-repeat
    background-position: center
    background-size: 20px
    font-size: 0

  .volatile
    background: #cad7ff
    padding-left: 0.5em
    padding-right: 0.5em
    padding-top: 0.1em
    padding-bottom: 0.1em

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

  .downloadinfo
    float: right
    margin-top: 30px

  .dlcount
    color: gray
    font-size: 85%
    text-align: center
    display: block

  .disabled
    opacity: 0.5

  .downloadOverlay
    position: absolute
    overflow: hidden
    width: 100%
    height: 100%
    background: rgba(255,255,255,0.9)
    z-index: 10
    text-align: center
    padding: 2em
    box-sizing: border-box

  .blur > *:not(.downloadOverlay)
    filter: blur(6px)

  .paragraph
    margin-top: 1em

  a.link
    cursor: pointer
    color: #007bff
    text-decoration: none
    background-color: transparent
    &:hover
      color: #0056b3
      text-decoration: underline
</style>

<template>
<main id="search" v-bind:class="{ blur: downloadInProgress }">
  <div v-if="displayBetaNotification" class="betanote">
    This is the beta version of Cloudnet data portal.
    Click <a href="http://devcloudnet.fmi.fi/">here</a> to visit the devcloudnet data portal, or
    <a href="http://legacy.cloudnet.fmi.fi/">here</a> to navigate to the legacy cloudnet site.
    <span class="close" @click="displayBetaNotification = !displayBetaNotification">&#10005;</span>
  </div>
  <div v-if="devMode.activated" class="rednote">
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
      <div
        v-if="isTrueOnBothDateFields('isValidDateString') && !isTrueOnBothDateFields('isNotInFuture')"
        class="errormsg"
      >Provided date is in the future.
      </div>
      <div
        v-if="isTrueOnBothDateFields('isValidDateString') && (!dateFromError.isBeforeEnd || !dateToError.isAfterStart)"
        class="errormsg"
      >Date from must be before date to.
      </div>
    </div>

    <custom-multiselect
      label="Product"
      v-model="selectedProductIds"
      :options="allProducts"
      id="productSelect"
      :icons="true"
      :getIconUrl="getIconUrl"
      :devMode="devMode">
    </custom-multiselect>

    <a @click="reset" id="reset">Reset filter</a>
  </section>

  <section id="fileTable">
    <span class="listTitle"> {{ captionText }} </span>
    <b-table id="tableContent" borderless small striped hover sort-icon-left
      :items="apiResponse"
      :fields="[
                { key: 'product.id', label: '', tdClass: 'icon', tdAttr: setIcon},
                { key: 'title', label: 'Data object', sortable: true},
                { key: 'volatile', label: '' },
                { key: 'measurementDate', label: 'Date', sortable: true},
                ]"
      :current-page="currentPage"
      :per-page="perPage"
      :busy="isBusy"
      @row-clicked="clickRow">
    <template v-slot:cell(volatile)="data">
      <span
        v-if="data.item.volatile"
        class="volatile"
        title="The data for this day may be incomplete. This file is updating in real time.">
        volatile
      </span>
    </template>
    </b-table>
    <b-pagination id="pagi" v-if="listLength > perPage"
      v-model="currentPage"
      :total-rows="listLength"
      :per-page="perPage"
      :disabled="isBusy"
      aria-controls="fileTable"
      align="center"
    ></b-pagination>
    <div class="downloadinfo">
      <a class="download" :disabled="isBusy" @click="downloadInProgress = true" :href="downloadUri" download>
        Download all results
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      </a><br>
      <span class="dlcount" v-bind:class="{ opaque: isBusy }">
        {{ listLength }} files (~{{ humanReadableSize(combinedFileSize(apiResponse)) }})
      </span><br>
    </div>
  </section>
  <div v-if="downloadInProgress" class="downloadOverlay">
    <h2>Your download is being prepared.</h2>
    You are about about to download <strong>{{ humanReadableSize(combinedFileSize(apiResponse)) }}</strong> of files.
    <p class="paragraph">Your download will begin shortly.<br>
    <a class="link" @click="downloadInProgress = false">Continue browsing &rarr;</a></p>
  </div>
</main>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import VCalendar from 'v-calendar'
import axios from 'axios'
import { File } from '../../../backend/src/entity/File'
import { BTable } from 'bootstrap-vue/esm/components/table'
import { BPagination } from 'bootstrap-vue/esm/components/pagination'
import Datepicker from '../components/Datepicker.vue'
import CustomMultiselect from '../components/Multiselect.vue'
import { getIconUrl, humanReadableSize, combinedFileSize } from '../lib'
import { DevMode } from '../lib/DevMode'

Vue.component('datepicker', Datepicker)
Vue.component('b-table', BTable)
Vue.component('b-pagination', BPagination)
Vue.component('custom-multiselect', CustomMultiselect)

Vue.use(VCalendar)

export interface Selection {
  id: string;
  humanReadableName: string;
}

@Component({name: 'app-search'})
export default class Search extends Vue {

  // api call
  apiUrl = process.env.VUE_APP_BACKENDURL
  apiResponse: File[] = this.resetResponse()

  // file list
  sortBy = 'title'
  sortDesc = false
  isBusy = false
  currentPage = 1
  perPage = 15

  // site selector
  allSites = []
  selectedSiteIds = []

  // dates
  beginningOfHistory = new Date('1970-01-01')
  today = new Date()
  dateFrom = new Date(new Date().getFullYear().toString())
  dateTo = this.today
  dateFromError: { [key: string]: boolean } = {}
  dateToError: { [key: string]: boolean } = {}

  // products
  allProducts = []
  selectedProductIds = []

  renderComplete = false

  displayBetaNotification = true
  downloadInProgress = false

  getIconUrl = getIconUrl
  humanReadableSize = humanReadableSize
  combinedFileSize = combinedFileSize
  devMode = new DevMode()

  isTrueOnBothDateFields(errorId: string) {
    return this.dateFromError[errorId] && this.dateToError[errorId]
  }

  created() {
    this.initView()
  }

  mounted() {
    // Wait until all child components have rendered
    this.$nextTick(() => {
      window.addEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
      this.renderComplete = true
    })
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
  }

  async initView() {
    this.adjustPerPageAccordingToWindowHeight()
    const payload = { params: { developer: this.devMode.activated || undefined } }
    Promise.all([
      axios.get(`${this.apiUrl}sites/`, payload),
      axios.get(`${this.apiUrl}products/`, payload)
    ]).then(([sites, products]) => {
      this.allSites = sites.data.sort((a: Selection, b: Selection) => a.humanReadableName > b.humanReadableName)
      this.allProducts = products.data.sort((a: Selection, b: Selection) => a.humanReadableName > b.humanReadableName)
      this.fetchData()
    })
  }

  get payload() {
    return {
      params: {
        location: this.selectedSiteIds,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        product: this.selectedProductIds,
        developer: this.devMode.activated || undefined
      }
    }
  }

  fetchData() {
    this.currentPage = 1
    this.isBusy = true
    axios
      .get(`${this.apiUrl}files/`, this.payload)
      .then(res => {
        this.apiResponse = res.data
        this.isBusy = false
      })
      .catch(() => {
        this.apiResponse = this.resetResponse()
        this.isBusy = false
      })
  }

  get listLength() {
    return this.apiResponse.length
  }

  get captionText() {
    if (this.isBusy) return 'Searching...'
    return this.listLength > 0 ? `Found ${this.listLength} results` : 'No results'
  }

  get downloadUri() {
    return axios.getUri({...{ method: 'post', url: `${this.apiUrl}download/`}, ...this.payload })
  }

  resetResponse() {
    return []
  }

  clickRow(record: File) {
    if (this.listLength > 0) this.$router.push(`file/${record.uuid}`)
  }


  setIcon(product: string) {
    if (product) return {'style': `background-image: url(${getIconUrl(product)})`}
  }

  reset() {
    this.$router.go(0)
  }

  adjustPerPageAccordingToWindowHeight() {
    this.perPage = Math.max(Math.floor(document.documentElement.clientHeight / 70), 10)
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
    this.fetchData()
  }

  @Watch('selectedProductIds')
  onProductSelected() {
    this.fetchData()
  }

  @Watch('devMode.activated')
  onDevModeToggled() {
    this.initView()
  }
}
</script>
