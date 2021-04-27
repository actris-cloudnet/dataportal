<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/spinner.sass"

.dataviz-yearblock
  display: inline-block
  height: 100%
  width: calc(100% - 3em)

.dataviz-year
  display: inline-block
  width: 3em
  font-family: monospace

.dataviz-date
  width: calc(1%/3.66)
  height: 1em
  display: inline-block

.dataviz-skippedyears
  text-align: center
  color: lightgrey
  font-style: italic


.all-data
  background: #5ac413

.missing-data
  background: #f7e91b

.only-model-data
  background: lightgrey

.no-data
  background: white

.dav-legend
  margin-top: 1em

.legendcolor
  width: 1em
  height: 1em
  border: solid 1px black
  display: inline-block
  position: relative
  bottom: -2px

.legendexpl
  font-size: 0.8em
  display: inline-block
  margin-right: 1em
</style>


<template>
  <div id="data_availability_visualization" v-if="!busy">
    <div v-for="(year, index) in years"
         v-bind:key="year['year']"
         class="dataviz-row">
      <div
          v-if="index && (parseInt(year['year']) + 1) !== parseInt(years[index - 1]['year'])"
          class="dataviz-skippedyears">
        No data for years {{ parseInt(year['year']) + 1 }} - {{ parseInt(years[index - 1]['year']) - 1 }}.
      </div>
      <div class="dataviz-year">{{ year['year'] }}</div>
      <div class="dataviz-yearblock">
        <div v-for="date in year.dates"
             v-bind:key="date['date']"
             class="dataviz-date"
             :class="{
          'all-data': date.products.length === 9,
          'missing-data': date.products.length < 9 && date.products.length > 1,
          'only-model-data': date.products.length === 1 && date.products.includes('Model'),
          'no-data': date.products.length === 0}">
        </div>
      </div>
    </div>
    <div>
    </div>
    <div class="dav-legend">
      <div class="legendexpl"><div class="all-data legendcolor"></div> All data</div>
      <div class="legendexpl"><div class="missing-data legendcolor"></div> Missing some measurement data or products</div>
      <div class="legendexpl"><div class="only-model-data legendcolor"></div> Only model data</div>
      <div class="legendexpl"><div class="no-data legendcolor"></div> No data</div>
    </div>
  </div>
  <div v-else class="loadingoverlay">
    <div class="lds-dual-ring"></div>
  </div>
</template>


<script lang="ts">
import {Component, Prop} from 'vue-property-decorator'
import Vue from 'vue'
import axios from 'axios'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import {dateToString} from '@/lib'

interface ProductDate {
  date: string;
  products: string[];
}

interface ProductYear {
  year: string;
  dates: ProductDate[];
}

@Component
export default class ProductAvailabilityVisualization extends Vue {
  @Prop() site!: string
  @Prop() loadingComplete!: () => void
  apiUrl = process.env.VUE_APP_BACKENDURL
  response: SearchFileResponse[] = []
  years: ProductYear[] = []
  busy = true

  mounted() {
    axios.get(`${this.apiUrl}search/`, { params: { site: this.site }})
      .then(({data}) => {
        this.response = data
        const initialDate = new Date(`${data[data.length - 1].measurementDate.substr(0,4)}-01-01`)
        const endDate = new Date(data[0].measurementDate)
        console.log(initialDate, endDate)
        const allDates: string[] = []
        while (initialDate <= endDate) {
          allDates.push(dateToString(new Date(initialDate)))
          initialDate.setDate(initialDate.getDate() + 1)
        }
        console.log(allDates[0], allDates[allDates.length - 1])
        this.years = this.response
          .reduce((acc: ProductYear[], cur) => {
            const [year, month, day] = cur.measurementDate.toString().split('-')
            const date = `${month}-${day}`
            const yearIndex = acc.findIndex(obj => obj.year == year)
            if (yearIndex == -1) {
              const newObj = {
                year,
                dates: allDates
                  .filter(dateStr => dateStr.substr(0,4) == year)
                  .map(dateStr => {
                    const dateSubstr = dateStr.substr(5)
                    return {
                      date: dateSubstr,
                      products: dateSubstr == date ? [cur.product] : []
                    }
                  })
              }
              return acc.concat([newObj])
            } else {
              const foundObj = acc[yearIndex]
              const dateIndex = foundObj.dates.findIndex(obj => obj.date == date)
              if (dateIndex != -1) {
                acc[yearIndex].dates[dateIndex].products.push(cur.product)
              }
              return acc
            }
          }, [])
      })
      .finally(() => {
        this.busy = false
        this.$nextTick(this.loadingComplete)
      })
  }
}
</script>
