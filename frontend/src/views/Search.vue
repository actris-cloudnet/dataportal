
<template>
  <section id="tableContainer">
  <div v-if="listLength > 0" id="fileTable">
    <b-table
      borderless
      small
      caption-top
      striped
      hover
      sort-icon-left
      :items="response.data"
      :fields="[{ key: 'title', label: 'File type', sortable: true, tdClass: 'titleCol'},
                { key: 'measurementDate', label: 'Date', sortable: true}, ]"
      :current-page="currentPage"
      :per-page="perPage"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      @row-clicked="clickRow"
      :caption="listCaption"
    ></b-table>
    <b-pagination id="pagi" v-if="listLength > perPage"
      v-model="currentPage"
      pills
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
  response = {'data': [{'uuid': ''}]}
  error = false

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

  created () {
    this.fetchData('?siteId=macehead')
  }

  get listLength() {
    return this.response['data'].length
  }

  get listCaption () {
    const nFiles = this.listLength
    return 'Found ' + nFiles + ' digital objects:'
  }

  clickRow( _: number, index: number) {
    this.$router.push('file/' + this.response.data[index].uuid)
  }

  @Watch('response')
  onPropertyChanged() {
    this.currentPage = 1
  }

}
</script>


<style lang="sass">
  @import "../sass/variables.sass"

  #tableContainer
    display: flex;
    justify-content: center;

  #fileTable
    margin-top: 30px;
    padding-bottom: 100px;
    text-align: left;

  .titleCol
    width: 500px;

  #fileTable caption
    font-size: 140%;

  #pagi
    margin-top: 30px;

  .page-item.active .page-link
    background-color: lightskyblue;
    border-color: lightsteelblue;

  .table-striped > tbody > tr:nth-child(2n+1) > td, .table-striped > tbody > tr:nth-child(2n+1) > th
    background-color: $blue-dust;
    
  .table-hover tbody tr:hover td, .table-hover tbody tr:hover th
    background-color: lightsteelblue;

  .table-striped > tbody > tr > td 
    padding: 7px;

  .page-link
    color: $blue-sapphire;

</style>>
