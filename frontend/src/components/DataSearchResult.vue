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

    .text-center.my-2
      display: none

    .icon
      background-repeat: no-repeat
      background-position: center
      background-size: 20px
      font-size: 0

    .volatile
      background: #cad7ff
      padding: 0.1em 0.5em

    .downloadinfo
      float: right
      margin-top: 30px

    .dlcount
      color: gray
      font-size: 85%
      text-align: center
      display: block
</style>


<template>
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
             :show-empty="true"
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
    <div class="downloadinfo" v-if="listLength > 0">
      <a class="download"
         v-bind:class="{ disabled: isBusy }"
         :href="isBusy? '#' : downloadUri" download>
        Download all
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      </a><br>
      <span class="dlcount" v-bind:class="{ disabled: isBusy }">
          {{ listLength }} files ({{ humanReadableSize(combinedFileSize(apiResponse)) }})
        </span><br>
    </div>
  </section>
</template>


<script lang="ts">
import {Component, Prop, Watch} from 'vue-property-decorator'
import { File } from '../../../backend/src/entity/File'
import Vue from 'vue'
import { getIconUrl, humanReadableSize, combinedFileSize } from '../lib'

@Component
export default class DataSearchResult extends Vue {
  @Prop() apiResponse!: File[]
  @Prop() isBusy!: boolean
  @Prop() downloadUri!: string

  sortBy = 'title'
  sortDesc = false
  currentPage = 1
  perPage = 15

  getIconUrl = getIconUrl
  humanReadableSize = humanReadableSize
  combinedFileSize = combinedFileSize

  mounted() {
    window.addEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.adjustPerPageAccordingToWindowHeight)
  }

  get listLength() {
    return this.apiResponse.length
  }

  get captionText() {
    if (this.isBusy) return 'Searching...'
    return this.listLength > 0 ? `Found ${this.listLength} results` : 'No results'
  }

  clickRow(record: File) {
    if (this.listLength > 0) this.$router.push(`/file/${record.uuid}`)
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
