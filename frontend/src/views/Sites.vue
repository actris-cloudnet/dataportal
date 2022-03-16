<style lang="sass">
@import "../sass/variables.sass"

h1
  margin-bottom: 2rem

.table
  width: unset

.table-striped
  th:focus
    outline: thin dotted
  td, th
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

.item + .item
  margin-top: 4rem
</style>

<template>
  <main>
    <div v-for="item in items" :key="item.title" class="item">
      <h1>{{ item.title }}</h1>
      <b-table
        borderless small striped hover sort-icon-left
        :items="item.sites"
        :fields="[
          { key: 'humanReadableName', label: 'Site', sortable: true },
          { key: 'country', label: 'Country', sortable: true },
          { key: 'latitude', label: 'Latitude', sortable: true },
          { key: 'longitude', label: 'Longitude', sortable: true },
          { key: 'altitude', label: 'Altitude', sortable: true },
          { key: 'gaw', label: 'GAW ID' },
        ]"
        @row-clicked="clickRow"
      >
        <template #cell(latitude)="data">
          {{ data.item.latitude }}&deg;&nbsp;N
        </template>
        <template #cell(longitude)="data">
          {{ data.item.longitude }}&deg;&nbsp;E
        </template>
        <template #cell(altitude)="data">
          {{ data.item.altitude }}&nbsp;m
        </template>
        <template #cell(gaw)="data">
          {{ data.item.gaw != 'Unknown' ? data.item.gaw : '-' }}
        </template>
      </b-table>
    </div>
  </main>
</template>


<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {BTable} from 'bootstrap-vue/esm/components/table'
import {Site, SiteType} from '../../../backend/src/entity/Site'
import axios from 'axios'

@Component({
  components: {BTable}
})
export default class SitesView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL
  items: { title: string; sites: Site[] }[] = []

  data() {
    return {
      items: []
    }
  }

  async created() {
    const response = await axios.get(`${this.apiUrl}sites`)
    const sites: Site[] = response.data
    this.items = [
      {
        title: 'Cloudnet sites',
        sites: sites.filter(site => site.type.includes('cloudnet' as SiteType))
      },
      {
        title: 'Campaign sites',
        sites: sites.filter(site => site.type.includes('campaign' as SiteType))
      },
      {
        title: 'ARM sites',
        sites: sites.filter(site => site.type.includes('arm' as SiteType))
      },
    ]
  }

  clickRow(site: Site) {
    this.$router.push({ name: 'Site', params: { siteid: site.id } })
  }

}

</script>
