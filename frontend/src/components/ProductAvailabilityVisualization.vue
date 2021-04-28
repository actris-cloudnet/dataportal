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
  position: relative

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

.dataviz-tooltip
  display: none
  position: absolute
  top: 1.3em
  z-index: 6
  background: white
  padding: 0.5em
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2)

  header
    font-weight: bold

  section
    display: flex
    flex-grow: 2
    font-size: 0.9em
    justify-content: center
    align-items: center
    padding: 0.5em

    ul
      min-width: 7.5em
      padding-left: 0
      list-style: none
      white-space: pre-wrap

      li.found::before
        content: '✓'
        color: green
        padding-right: 0.3em

      li:not(.found)::before
        content: '✘'
        color: #c60000
        padding-right: 0.3em

      li.modelitem
        margin-top: 0.8em

.dataviz-date:hover .dataviz-tooltip
  display: block
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
          'all-data': date.products['lvl2'].length === 4,
          'missing-data': date.products['lvl2'].length < 4 && date.products['lvl1b'].length > 0,
          'only-model-data': date.products['lvl1b'].length === 0 && date.products['model'].length,
          'no-data': date.products['lvl1b'].length === 0 && date.products['model'].length === 0}" >
          <div class="dataviz-tooltip">
            <header>{{ year['year']}}-{{ date['date']}}</header>
            <section>
              <ul>
                <li v-for="product in filterProductsByLvl('lvl1b')"
                  :class="{found: date.products['lvl1b'].includes(product.id) }"
                  :key="product.id">{{ product.humanReadableName }}</li>
                <li class="modelitem" :class="{found: date.products['model'].length }">Model</li>
              </ul>
              <ul>
                <li v-for="product in filterProductsByLvl('lvl1c')"
                  :class="{found: date.products['lvl1c'].includes(product.id) }"
                  :key="product.id">{{ product.humanReadableName }}</li>
              </ul>
              <ul>
                <li v-for="product in filterProductsByLvl('lvl2')"
                  :class="{found: date.products['lvl2'].includes(product.id) }"
                  :key="product.id">{{ product.humanReadableName }}</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
    <div>
    </div>
    <div class="dav-legend" v-if="legend">
      <div class="legendexpl"><div class="all-data legendcolor"></div> All data</div>
      <div class="legendexpl"><div class="missing-data legendcolor"></div> Missing some data</div>
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
import {Product} from '../../../backend/src/entity/Product'

interface ProductLevels {
  lvl1b: string[];
  lvl1c: string[];
  lvl2: string[];
  model: string[];
}

interface ProductDate {
  date: string;
  products: ProductLevels;
}

interface ProductYear {
  year: string;
  dates: ProductDate[];
}

@Component
export default class ProductAvailabilityVisualization extends Vue {
  @Prop() site!: string
  @Prop() loadingComplete?: () => void
  @Prop() downloadComplete?: () => void
  @Prop() legend!: boolean
  apiUrl = process.env.VUE_APP_BACKENDURL
  response: SearchFileResponse[] = []
  years: ProductYear[] = []
  allProducts: Product[] = []
  lvlTranslate: { [key: string]: keyof ProductLevels } = {
    'lidar': 'lvl1b',
    'radar': 'lvl1b',
    'mwr': 'lvl1b',
    'categorize': 'lvl1c',
    'classification': 'lvl2',
    'lwc': 'lvl2',
    'iwc': 'lvl2',
    'drizzle': 'lvl2',
    'model': 'model'
  }
  busy = true

  mounted() {
    Promise.all([
      axios.get(`${this.apiUrl}search/`, { params: { site: this.site }}),
      axios.get(`${this.apiUrl}products/` )
    ])
      .then(([searchRes, productsRes]) => {
        if (this.downloadComplete) this.downloadComplete()
        this.response = searchRes.data
        this.allProducts = productsRes.data
        const initialDate = new Date(
          `${this.response[this.response.length - 1].measurementDate.toString().substr(0,4)}-01-01`)
        const endDate = new Date(this.response[0].measurementDate)
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
            const {productId} = cur
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
                      products: dateSubstr == date ? this.createProductLevels(productId) : this.createProductLevels()
                    }
                  })
              }
              return acc.concat([newObj])
            } else {
              const foundObj = acc[yearIndex]
              const dateIndex = foundObj.dates.findIndex(obj => obj.date == date)
              const existingProducts = acc[yearIndex].dates[dateIndex].products
              acc[yearIndex].dates[dateIndex].products = this.createProductLevels(productId, existingProducts)
              return acc
            }
          }, [])
      })
      .finally(() => {
        this.busy = false
        if (this.loadingComplete) this.$nextTick(this.loadingComplete)
      })
  }

  createProductLevels(productId?: string, existingObj?: ProductLevels) {
    if (!existingObj) {
      existingObj = {
        lvl1b: [],
        lvl1c: [],
        lvl2: [],
        model: []
      }
    }
    if (productId) existingObj[this.lvlTranslate[productId]].push(productId)
    return existingObj
  }

  filterProductsByLvl(lvl: string) {
    return this.allProducts.filter(({id}) => this.lvlTranslate[id] == lvl)
  }

}
</script>
