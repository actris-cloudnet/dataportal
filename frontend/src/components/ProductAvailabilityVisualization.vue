<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/spinner.sass"

$legacy-color: #adadad

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
  border-top: 1px solid gray
  border-bottom: 1px solid gray

.dataviz-date:last-child
  border-right: 1px solid gray

.dataviz-date:first-child
  border-left: 1px solid gray

.dataviz-skippedyears
  text-align: center
  color: lightgrey
  font-style: italic


.all-data
  background: #5ac413

.missing-data
  background: #f7e91b

.only-legacy-data
  background: $legacy-color

.only-model-data
  background: #D3D3D3

.no-data
  background: white

.legacy-label
  color: grey

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
      min-width: 8em
      padding-left: 0
      list-style: none
      white-space: pre-wrap
      margin-bottom: 0

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
          'all-data': allData(date.products),
          'missing-data': missingData(date.products),
          'only-legacy-data': onlyLegacy(date.products),
          'only-model-data': onlyModel(date.products),
          'no-data': noData(date.products)}" >
          <div class="dataviz-tooltip" v-if="tooltips">
            <header>{{ year['year']}}-{{ date['date']}}</header>
            <section>
              <ul v-for="lvl in levels">
                <li v-for="product in filterProductsByLvl(lvl)"
                    :class="{found: getExistingProduct(date.products[lvl], product) }"
                    :key="product.id">{{ idToHumanReadable(product.id) }}
                  <sup class="legacy-label" v-if="getExistingProduct(date.products[lvl], product) && getExistingProduct(date.products[lvl], product).legacy">L</sup></li>
                <li v-if="lvl === 'lvl1b'" class="modelitem" :class="{found: getExistingProduct(date.products[lvl], {id: 'model'}) }">Model</li>
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
      <div class="legendexpl"><div class="only-legacy-data legendcolor"></div> Only legacy data</div>
      <div class="legendexpl"><div class="only-model-data legendcolor"></div> Only model data</div>
      <div class="legendexpl"><div class="no-data legendcolor"></div> No data</div><br>
      <div class="legendexpl"><span class="legacy-label">L</span> Legacy file</div>
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
import {dateToString, idToHumanReadable} from '@/lib'
import {Product} from '../../../backend/src/entity/Product'

interface ProductInfo {
  id: string;
  legacy: boolean;
}

interface ProductLevels {
  lvl1b: ProductInfo[];
  lvl1c: ProductInfo[];
  lvl2: ProductInfo[];
}

interface ProductDate {
  date: string;
  products: ProductLevels;
}

interface ProductYear {
  year: string;
  dates: ProductDate[];
}

interface ReducedSearchResponse {
  measurementDate: string;
  productId: string;
  legacy: boolean;
}

@Component
export default class ProductAvailabilityVisualization extends Vue {
  @Prop() site!: string
  @Prop() loadingComplete?: () => void
  @Prop() downloadComplete?: () => void
  @Prop() legend!: boolean
  @Prop() dateFrom?: string
  @Prop() tooltips?: boolean

  apiUrl = process.env.VUE_APP_BACKENDURL
  response: ReducedSearchResponse[] = []
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
    'model': 'lvl1b'
  }
  busy = true

  idToHumanReadable = idToHumanReadable

  mounted() {
    const payload = {
      site: this.site,
      dateFrom: this.dateFrom || undefined,
      showLegacy: true,
      properties: ['measurementDate', 'productId', 'legacy']
    }

    Promise.all([
      axios.get(`${this.apiUrl}search/`, { params: payload } ),
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
            const productInfo = { id: cur.productId, legacy: cur.legacy }
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
                      products: dateSubstr == date ? this.createProductLevels(productInfo) : this.createProductLevels()
                    }
                  })
              }
              return acc.concat([newObj])
            } else {
              const foundObj = acc[yearIndex]
              const dateIndex = foundObj.dates.findIndex(obj => obj.date == date)
              const existingProducts = acc[yearIndex].dates[dateIndex].products
              acc[yearIndex].dates[dateIndex].products = this.createProductLevels(productInfo, existingProducts)
              return acc
            }
          }, [])
      })
      .finally(() => {
        this.busy = false
        if (this.loadingComplete) this.$nextTick(this.loadingComplete)
      })
  }

  createProductLevels(productInfo?: ProductInfo, existingObj?: ProductLevels) {
    if (!existingObj) {
      existingObj = {
        lvl1b: [],
        lvl1c: [],
        lvl2: [],
      }
    }
    if (productInfo) {
      const {id, legacy} = productInfo
      existingObj[this.lvlTranslate[id]].push({
        id,
        legacy
      })
    }
    return existingObj
  }

  filterProductsByLvl(lvl: string) {
    return this.allProducts.filter(({id}) => this.lvlTranslate[id] == lvl && id != 'model')
  }

  getExistingProduct(existingProducts: ProductInfo[], product: Product) {
    return existingProducts.find(prod => prod.id == product.id)
  }

  get levels() {
    return new Set(Object.values(this.lvlTranslate))
  }

  allData(products: ProductLevels) {
    return products['lvl2'].length === 4
      && products['lvl2'].every(prod => !prod.legacy)
  }

  missingData(products: ProductLevels) {
    return products['lvl2'].length < 4
      && products['lvl1b'].length > 1
  }

  onlyLegacy(products: ProductLevels) {
    return products['lvl2'].every(prod => prod.legacy)
      && products['lvl1c'].every(prod => prod.legacy)
      && products['lvl1b'].every(prod => prod.legacy || prod.id === 'model')
  }

  onlyModel(products: ProductLevels) {
    return products['lvl1c'].length === 0
      && products['lvl2'].length === 0
      && products['lvl1b'].length === 1
      && products['lvl1b'][0].id === 'model'
  }

  noData(products: ProductLevels) {
    return products['lvl1b'].length === 0
      && products['lvl1c'].length === 0
      && products['lvl2'].length === 0
  }
}
</script>
