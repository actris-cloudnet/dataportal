<style scoped lang="sass">
h1
  margin-bottom: 1rem

table
  margin-top: 1rem
  border-collapse: collapse

  &.loading
    opacity: 0.25

td, th
  padding: .25rem 1rem 0 0

  &:first-child
    text-align: right

.bar
  display: flex
  align-items: center

.bar-bar
  height: 1rem
  background-color: steelblue
  border-radius: 2px

.bar-number
  font-size: 50%
  color: gray
  margin-left: 4px
</style>


<template>
  <main>
    <h1>Download statistics</h1>
    <label>
      Dimension:
      <select v-model="selectedDimensions">
        <option value="date,downloads">Downloads by date</option>
        <option value="date,uniqueIps">Unique IPs by date</option>
        <option value="country,downloads">Downloads by country</option>
      </select>
    </label><br>
    <label>
      File country:
      <select v-model="fileCountry" :disabled="loadingCountries">
        <option :value="null">--- any ---</option>
        <option v-for="country in countries" :key="country" :value="country">
          {{ country }}
        </option>
      </select>
    </label><br>
    <label>
      <input type="checkbox" value="file" v-model="type">
      File
    </label>
    <label style="margin-left:.5rem">
      <input type="checkbox" value="rawFile" v-model="type">
      Raw file
    </label>
    <label style="margin-left:.5rem">
      <input type="checkbox" value="fileInCollection" v-model="type">
      File in collection
    </label><br>
    <button @click="onSearch" :disabled="type.length == 0 || loading || loadingCountries">
      {{ loading ? 'Loading...' : 'Search' }}
    </button>
    <table v-if="statistics" :class="{loading}">
      <thead>
        <tr>
          <th>{{ DIMENSION_LABEL[dimensions[0]] }}</th>
          <th>{{ DIMENSION_LABEL[dimensions[1]] }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in statistics" :key="item.date">
          <td v-if="dimensions[0] == 'country'">
            {{ COUNTRY_NAMES[item[dimensions[0]]] || item[dimensions[0]] || 'Unknown' }}
          </td>
          <td v-else>
            {{ item[dimensions[0]] || 'Unknown' }}
          </td>
          <td>
            <div class="bar">
              <div class="bar-bar" :style="{
                // Calculate bar width of at least 1 pixel.
                width: Math.max(1, 100 * item[dimensions[1]] / maxValue) + 'px',
                // For 1 pixel bar, indicate quantity with opacity.
                opacity: Math.min(1, .25 + .75 * (100 * item[dimensions[1]] / maxValue)),
              }"></div>
              <div class="bar-number">
                {{ numberFormat.format(item[dimensions[1]]) }}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>


<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import axios from 'axios'

import {Site} from '../../../backend/src/entity/Site'
import COUNTRY_NAMES from '../assets/country-io-names.json'

@Component({
  components: {}
})
export default class StatsView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL
  statistics: any[] = []
  dimensions: string[] = []
  loading = false
  fileCountry = null
  type = ['file']
  maxValue = 0
  selectedDimensions = 'date,downloads'
  DIMENSION_LABEL = {
    'date': 'Date',
    'country': 'Country',
    'downloads': 'Downloads',
    'uniqueIps': 'Unique IPs',
  }
  COUNTRY_NAMES = COUNTRY_NAMES
  numberFormat = (Intl && Intl.NumberFormat && new Intl.NumberFormat('en-GB')) || {
    format(number: number): string {
      return number.toString()
    }
  }
  loadingCountries = true
  countries: string[] = []

  async created() {
    try {
      const response = await axios.get(`${this.apiUrl}sites`)
      const sites: Site[] = response.data
      this.countries = Array.from(
        new Set(sites.map(site => site.country || 'Unknown'))
      ).sort()
      this.loadingCountries = false
    } catch (e) {
      alert('Failed to download counties')
    }
  }

  async onSearch() {
    this.loading = true
    const params = {
      dimension: this.selectedDimensions,
      type: this.type.join(','),
      fileCountry: this.fileCountry || undefined,
    }
    try {
      const response = await axios.get(`${this.apiUrl}download/stats`, { params })
      this.loading = false
      this.statistics = response.data
      this.dimensions = this.selectedDimensions.split(',')
      this.maxValue = Math.max(...this.statistics.map(d => d[this.dimensions[1]]))
    } catch (e) {
      this.loading = false
      alert('Failed to download statistics')
    }
  }
}
</script>
