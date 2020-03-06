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
      :fields="[
                { key: 'title', label: 'Title', sortable: true, tdClass: 'titleCol'},
                { key: 'measurementDate', label: 'Date', sortable: true, tdClass: 'dateCol'}, 
                { key: 'product', label: 'Type', sortable: false, tdClass: styleMe},
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
    return 'Found ' + nFiles + ' results'
  }

  clickRow( _: number, index: number) {
    this.$router.push('file/' + this.response.data[index].uuid)
  }

  @Watch('response')
  onPropertyChanged() {
    this.currentPage = 1
  }

  styleMe(product: string) {
    if (product === 'classification') {
      return "iconColu"
    }
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
    width: 400px;

  .dateCol
    width: 150px;

  #fileTable caption
    font-size: 80%;

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

  .iconColu
    background-color: white;
    background-image: url(../assets/radar_icon_small.png);
    background-repeat: no-repeat;
    background-size: 25%;
    background-position: left;
    color: transparent; 


</style>>
