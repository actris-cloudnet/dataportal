<template>
  <section id="fileTableContainer">
  <div v-if="listLength > 0" id="fileTable">
    <b-table
      borderless
      small
      caption-top
      striped
      hover
      sort-icon-left
      :items="response.data"
      :fields="[{ key: 'title', label: 'Data object', sortable: true, tdClass: 'titleCol'},
                { key: 'measurementDate', label: 'Date', sortable: true, tdClass: 'dateCol'},
                { key: 'product', label: 'Type', sortable: false, thClass: 'typeHead', tdClass: iconStyle}
                ]"
      :current-page="currentPage"
      :per-page="perPage"
      @row-clicked="clickRow"
      :caption="listCaption"
    ></b-table>
    <b-pagination id="pagi" v-if="listLength > perPage"
      v-model="currentPage"
      align="center"
      :total-rows="listLength"
      :per-page="perPage"
      aria-controls="fileTable"
    ></b-pagination>
  </div>

  </section>

</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import axios from 'axios'

@Component
export default class Search extends Vue {

  currentPage = 1
  perPage = 25
  apiUrl = process.env.VUE_APP_BACKENDURL
  response = {'data': [{'uuid': '', 'product': ''}]}
  error = false

  created () {
    this.fetchData('?siteId=macehead')
  }

  fetchData( query: string ) {
    axios
      .get(`${this.apiUrl}files/` + query)
      .then(response => {
        this.response = response
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
  }

  get listLength() {
    return this.response['data'].length
  }

  get listCaption () {
    const nFiles = this.listLength
    return 'Found ' + nFiles + ' results'
  }

  clickRow( _: number, index: number) {
    this.$router.push('file/' + this.response.data[index].uuid)
  }

  @Watch('response')
  onPropertyChanged() {
    this.currentPage = 1
  }

  iconStyle(product: string) {
    return 'icon ' + product + 'Icon'
  }

}
</script>


<style lang="sass">
  @import "../sass/variables.sass"

  #fileTableContainer
    display: flex;
    justify-content: center;

  #fileTable
    margin-top: 30px;
    padding-bottom: 100px;
    text-align: left;
    caption
      font-size: 85%;

  .titleCol
    width: 400px;

  .dateCol
    width: 150px;

  #pagi
    margin-top: 30px;
    .page-item.active .page-link
      background-color: lightskyblue;
      border-color: lightsteelblue;
    .page-link
      color: $blue-sapphire;

  .table-striped
    td
      padding: 9px;
    tr:nth-child(2n+1) > td
      background-color: $blue-dust;
    tr:hover td
      background-color: lightsteelblue;

  .typeHead
    text-align: center;

  $iconPath: "../assets/icons/" ;
  .icon
    background-color: white;
    background-repeat: no-repeat;
    background-size: 20px;
    background-position: center;
    color: transparent;
  .radarIcon
    background-image: url(#{$iconPath}radar.png);
  .lidarIcon
    background-image: url(#{$iconPath}lidar.png);
  .mwrIcon
    background-image: url(#{$iconPath}mwr.png);
  .modelIcon
    background-image: url(#{$iconPath}model.png);
  .categorizeIcon
    background-image: url(#{$iconPath}categorize.png);
  .classificationIcon
    background-image: url(#{$iconPath}classification.png);
  .drizzleIcon
    background-image: url(#{$iconPath}drizzle.png);
  .lwcIcon
    background-image: url(#{$iconPath}lwc.png);
  .iwcIcon
    background-image: url(#{$iconPath}iwc.png);

</style>>
