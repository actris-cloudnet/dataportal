<template>

  <section id="fileTableContainer">
  <div id="fileTable">
    <span id="listTitle"> {{ captionText }} </span>
    <b-table id="tableContent" borderless small striped hover sort-icon-left
      :items="response.data"
      :fields="[{ key: 'title', label: 'Data object', sortable: true},
                { key: 'measurementDate', label: 'Date', sortable: true},
                { key: 'product', label: 'Type', tdClass: 'icon', tdAttr: setIcon}
                ]"
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
import axios from 'axios'

@Component
export default class Search extends Vue {

  isBusy = false
  currentPage = 1
  perPage = 25
  apiUrl = process.env.VUE_APP_BACKENDURL
  response = {'data': [{'uuid': '', 'product': ''}]}

  created () {
    this.fetchData('?siteId=macehead')
  }

  // Just for testing
  sleep (time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  fetchData( query: string ) {
    this.isBusy = true
    this.sleep(750).then(() => { // remove me for production
      axios
        .get(`${this.apiUrl}files/` + query)
        .then(response => {
          this.response = response
          this.isBusy = false
        })
        .catch(({response}) => {
          this.response = response
          this.isBusy = false
        })
    }
    )}

  get listLength() {
    return this.response['data'].length
  }

  get captionText () {
    if (this.isBusy) return 'Searching...'
    const nFiles = this.listLength
    return (nFiles > 0 ? 'Found ' + nFiles + ' results' : 'No results')
  }

  clickRow(_: number, index: number) {
    this.$router.push('file/' + this.response.data[index].uuid)
  }

  @Watch('response')
  onPropertyChanged() {
    this.currentPage = 1
  }

  setIcon(product: string) {
    if (product) {
      return {'style': 'background-image: url(' + require('../assets/icons/' + product + '.png') + ')'}
    }
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

  #tableContent
    margin-top: 10px;

  #listTitle
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
      width: 500px;
    th:nth-child(2)
      width: 150px;
    th:nth-child(3)
      width: 20px;
      text-align: center;
    td
      padding: 9px;
    tr:nth-child(2n+1) > td
      background-color: $blue-dust;
    tr:hover td
      cursor: pointer;
      background-color: #e4eff7;

  .icon
    background-repeat: no-repeat;
    background-size: 20px;
    background-position: center;
    color: transparent;
    font-size: 0;

</style>>
