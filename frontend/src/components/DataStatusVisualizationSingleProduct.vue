<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/spinner.sass"
@import "../sass/availability.sass"

.dataviz-date
  width: calc(1%/3.66)
  height: 1em
  display: inline-block
  position: relative
  border-top: 1px solid gray
  border-bottom: 1px solid gray
  cursor: default

.dataviz-tooltip
  position: fixed
  z-index: 10
  background: white
  padding-top: 0.1em
  padding-left: 0.2em
  padding-right: 0.2em
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2)

</style>


<template>
  <!-- eslint-disable vue/require-v-for-key -->
  <div id="data_availability_visualization" v-if="!busy">
    <div v-for="(year, index) in yearsReduced"
         v-bind:key="year['year']"
         class="dataviz-row">
      <div
          v-if="index && (parseInt(year['year']) + 1) !== parseInt(yearsReduced[index - 1]['year'])"
          class="dataviz-skippedyears">
        No data for years {{ parseInt(year['year']) + 1 }} - {{ parseInt(yearsReduced[index - 1]['year']) - 1 }}.
      </div>
      <div class="dataviz-year">{{ year['year'] }}</div>
      <div class="dataviz-yearblock" @mouseleave="debouncedHideTooltip()">
        <a v-for="date in year.dates"
             v-bind:key="date.date"
             class="dataviz-date"
             :id="`dataviz-color-${year['year']}-${date['date']}`"
             :href="createLinkToLandingPage(date.products)"
             :class="createColorClassForSingleProduct(date.products)"
             @mouseenter="debouncedSetCurrentYearDate(year, date, $event)"
             >
        </a>
      </div>
    </div>
    <div>
    </div>
    <div class="dav-legend" v-if="legend && !qualityScores">
      <div class="legendexpl"><div class="all-data legendcolor"></div> OK</div>
      <div class="legendexpl"><div class="only-legacy-data legendcolor"></div> Legacy</div>
      <div class="legendexpl"><div class="no-data legendcolor"></div> No data</div>
    </div>
    <div class="dav-legend" v-if="legend && qualityScores">
      <div class="legendexpl"><div class="all-data legendcolor"></div> Pass </div>
      <div class="legendexpl"><div class="missing-data legendcolor"></div> Fail </div>
      <div class="legendexpl"><div class="only-legacy-data legendcolor"></div> Missing QC report</div>
      <div class="legendexpl"><div class="no-data legendcolor"></div> No data</div><br>
    </div>
    <div class="dataviz-tooltip" v-if="tooltips && hover" v-bind:style="tooltipStyle">
      <header>{{year.year}}-{{date.date}}</header>
    </div>
  </div>
  <div v-else class="loadingoverlay">
    <div class="lds-dual-ring"></div>
  </div>
</template>


<script lang="ts">
import {Component, Prop} from 'vue-property-decorator'
import ProductAvailabilityVisualization from './DataStatusVisualization.vue'
import { ProductLevels, ProductYear, ProductDate } from '../lib/DataStatusParser'
import Header from '../components/Header.vue'
@Component({
  components: {Header}
})
export default class ProductAvailabilityVisualizationSingle extends ProductAvailabilityVisualization {
  @Prop() product!: string[]

  get yearsReduced() {
    return this.years.map(year => ({
      year: year.year,
      dates: year.dates.map(date => ({
        date: date.date,
        products: {
          '2': date.products['2'].filter(x => x.id == this.product[0]),
          '1b': date.products['1b'].filter(x => x.id == this.product[0]),
          '1c': date.products['1c'].filter(x => x.id == this.product[0]),
        }
      }))
    }))
  }

  createLinkToLandingPage(products: ProductLevels) {
    const prodsAll = products['2'].concat(products['1b'], products['1c'])
    if (prodsAll.length > 0) {
      const uuid = prodsAll[0].uuid
      if (this.qualityScores) {
        if (this.hasSomeTests(products)) {
          return `/quality/${uuid}`
        }
      } else {
        return `/file/${uuid}`
      }
    }
  }

  createColorClassForSingleProduct(products: ProductLevels) {
    if (this.qualityScores) {
      if (this.noData(products)) return 'no-data'
      if (this.onlyLegacy(products)) return 'only-legacy-data'
      if (!this.allPass(products) && this.hasSomeTests(products)) return 'missing-data'
      if (this.allPass(products)) return 'all-data'
      return 'only-legacy-data'
    }
    if (this.noData(products)) return 'no-data'
    if (this.onlyLegacy(products)) return 'only-legacy-data'
    return 'all-data'
  }

  onlyLegacy(products: ProductLevels) {
    return (products['2'].every(this.isLegacy)
        && products['1c'].every(this.isLegacy)
        && products['1b'].every(this.isLegacy))
  }

  setCurrentYearDate(year: ProductYear, date: ProductDate, event: MouseEvent) {
    this.tooltipStyle = {
      top: `${event.clientY - 40}px`,
      left: `${event.clientX - 40}px`
    }
    this.currentDate = date
    this.currentYear = year
    this.hover = true
  }

}
</script>
