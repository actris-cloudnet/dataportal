<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

section#fileTable
  padding-left: 30px
  padding-right: 30px
  width: 100%
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
    float: left
    .page-item.active .page-link
      background-color: $steel-warrior
      border-color: $steel-warrior
    .page-link:hover
      background-color: $blue-dust
    .page-link
      color: $blue-sapphire

  .table-striped
    th:focus
      outline: thin dotted
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
    tr:focus td
      background-color: #e4eff7
    tr
      outline: none

  .text-center.my-2
    display: none

  .icon
    background-repeat: no-repeat
    background-position: center
    background-size: 20px
    font-size: 0

  .rowtag
    display: inline-block
    width: 5em
    font-size: 0.9em

  .volatile
    background: #cad7ff

  .legacy
    background: #f2f2f2

  .downloadinfo
    float: right
    margin-top: 30px

  .dlcount
    color: gray
    font-size: 85%
    text-align: center
    display: block

  .download:focus
    outline: thin dotted black

.noresults
  text-align: center
  margin-top: 3em

</style>


<template>
  <section id="fileTable">
    <span class="listTitle" v-if="!simplifiedView">
      <span v-if="isBusy">Searching...</span>
      <span v-else-if="listLength > 0">Found {{ listLength }} results</span>
    </span>
    <div v-if="listLength == 0" class="noresults">
      <h2>No results</h2>
        Are we missing some data? Send an email to
        <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>.
    </div>
    <b-table v-if="listLength > 0"
        id="tableContent" borderless small striped hover sort-icon-left
        :items="apiResponse"
        :fields="[
                { key: 'productId', label: '', tdClass: 'icon', tdAttr: setIcon},
                { key: 'title', label: 'Data object', sortable: true},
                { key: 'volatile', label: '' },
                { key: 'measurementDate', label: 'Date', sortable: true},
                ]"
        :current-page="currentPage"
        :per-page="perPage"
        :busy="isBusy"
        :show-empty="true"
        @row-clicked="clickRow">
      <template v-slot:cell(volatile)="data">
      <span
        v-if="data.item.volatile"
        class="rowtag volatile"
        title="The data for this day may be incomplete. This file is updating in real time.">
        volatile
      </span>
      <span
          v-if="data.item.legacy"
          class="rowtag legacy"
          title="This is legacy data. Quality of the data is not assured.">
      legacy
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
    <div class="downloadinfo" v-if="listLength > 0 && !simplifiedView">
      <a class="download"
         v-bind:class="{ disabled: isBusy || downloadIsBusy }"
         href=""
         @click.prevent="createCollection()">
        Download all
      </a><br>
      <span v-if="!downloadFailed" class="dlcount" v-bind:class="{ disabled: isBusy || downloadIsBusy }">
        {{ listLength }} files ({{ humanReadableSize(combinedFileSize(apiResponse)) }})
      </span>
      <div v-else class="dlcount errormsg">
        Download failed!
      </div><br>
    </div>
  </section>
</template>


<script lang="ts">
import axios from 'axios'
import {Component, Prop, Watch} from 'vue-property-decorator'
import {File} from '../../../backend/src/entity/File'
import Vue from 'vue'
import {combinedFileSize, getIconUrl, humanReadableSize} from '../lib'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import {BTable} from 'bootstrap-vue/esm/components/table'
import {BPagination} from 'bootstrap-vue/esm/components/pagination'

Vue.component('b-table', BTable)
Vue.component('b-pagination', BPagination)

@Component
export default class DataSearchResult extends Vue {
  @Prop() apiResponse!: SearchFileResponse[]
  @Prop() isBusy!: boolean
  @Prop() downloadUri!: string
  @Prop() simplifiedView?: boolean
  downloadIsBusy = false
  downloadFailed = false
  apiUrl = process.env.VUE_APP_BACKENDURL

  sortBy = 'title'
  sortDesc = false
  currentPage = 1
  perPage = 15

  humanReadableSize = humanReadableSize
  combinedFileSize = combinedFileSize

  mounted() {
    window.addEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
    this.adjustPerPageAccordingToWindowHeight()
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
  }

  get listLength() {
    return this.apiResponse.length
  }

  get captionText() {
    if (this.isBusy) return 'Searching...'
    // eslint-disable-next-line max-len
    return this.listLength > 0 ? `Found ${this.listLength} results` : 'No results. Are we missing some data? Send an email to <a href="mailto:actris-cloudnet-feedback@fmi.fi">actris-cloudnet-feedback@fmi.fi</a>'
  }

  clickRow(record: File) {
    if (this.listLength > 0) this.$router.push(`/file/${record.uuid}`)
  }

  createCollection() {
    this.downloadIsBusy = true
    axios.post(`${this.apiUrl}collection`, { files: this.apiResponse.map(file => file.uuid)})
      .then(({data}) => this.$router.push({path: `/collection/${data}`}))
      .catch(err => {
        this.downloadFailed = true
        console.error(err)
      })
      .finally(() => (this.downloadIsBusy = false))
  }

  setIcon(product: string) {
    if (product) return {'style': `background-image: url(${getIconUrl(product)})`}
  }

  adjustPerPageAccordingToWindowHeight() {
    this.perPage = Math.max(Math.floor(document.documentElement.clientHeight / 70), 10)
  }

  @Watch('isBusy')
  onBusyChanged() {
    // Reset page on filter change
    if (!this.isBusy) {
      this.currentPage = 1
    }
  }
}
</script>
