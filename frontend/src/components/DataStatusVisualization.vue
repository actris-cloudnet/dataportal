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

.dataviz-date[href]
  cursor: pointer

.all-raw
  background: #a0df7b

.only-model-data
  background: #D3D3D3

.error-data
  background: #bd1919

.legacy-label
  color: grey

.dataviz-tooltip
  position: fixed
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
    align-items: flex-start
    padding: 0.5em
    width: 370px

    ul
      padding-left: 0.5em
      padding-right: 0.5em
      list-style: none
      white-space: pre-wrap
      margin-bottom: 0

      li.header
        font-weight: bold

      li.modelitem
        margin-top: 0.8em

      li.productitem.found::before
        content: '✓'
        color: green
        padding-right: 0.3em

      li.productitem:not(.found)::before
        content: '✘'
        color: #c60000
        padding-right: 0.3em

      li.productitem:not(.found).na::before
        content: '?'
        color: grey
        padding-right: 0.3em

.testspass
  color: green

.testsfail
  color: #c60000

.noquality
  color: grey

.incorrect-info
  display: none

.error-data .incorrect-info
  display: inline-block
  font-size: 0.7em
  color: #bd1919
  float: right

.dataviz-date:hover .dataviz-tooltip
  display: block
</style>

<template>
  <!-- eslint-disable vue/require-v-for-key -->
  <div id="data_availability_visualization" v-if="!busy">
    <div v-for="(year, index) in years" v-bind:key="year['year']" class="dataviz-row">
      <div
        v-if="index && parseInt(year['year']) + 1 !== parseInt(years[index - 1]['year'])"
        class="dataviz-skippedyears"
      >
        No data for years {{ parseInt(year["year"]) + 1 }} - {{ parseInt(years[index - 1]["year"]) - 1 }}.
      </div>
      <div class="dataviz-year">{{ year["year"] }}</div>
      <div class="dataviz-yearblock" @mouseleave="debouncedHideTooltip()">
        <a
          v-for="date in year.dates"
          class="dataviz-date"
          :id="`dataviz-color-${year.year}-${date.date}`"
          :class="createColorClass(date.products)"
          :href="createLinkToSearchPage(`${year.year}-${date.date}`, date.products)"
          @mouseenter="debouncedSetCurrentYearDate(year, date, $event)"
        ></a>
      </div>
    </div>
    <div></div>
    <div class="dav-legend" v-if="legend && !qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        All level 2
      </div>
      <div class="legendexpl">
        <div class="all-raw legendcolor"></div>
        Some level 1b
      </div>
      <div class="legendexpl">
        <div class="only-legacy-data legendcolor"></div>
        Only legacy
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        Only model
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <div class="legendexpl">
        <div class="error-data legendcolor"></div>
        Unknown
      </div>
      <br />
      <div class="legendexpl"><span class="legacy-label">L</span> Legacy</div>
    </div>
    <div class="dav-legend" v-if="legend && qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        All tests pass
      </div>
      <div class="legendexpl">
        <div class="missing-data legendcolor"></div>
        Some tests fail or missing
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        All tests missing
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <br />
      <div class="legendexpl"><span class="legacy-label testsfail">✘</span> Fail</div>
      <div class="legendexpl"><span class="legacy-label">?</span> Missing</div>
    </div>
    <div class="dataviz-tooltip" v-if="tooltips && hover" v-bind:style="tooltipStyle">
      <header>
        {{ year["year"] }}-{{ date["date"] }}
        <span class="incorrect-info">This information may be incorrect.</span>
      </header>
      <section>
        <ul v-for="lvl in allLevels">
          <li class="header">Level {{ lvl }}</li>
          <li
            v-for="product in filterProductsByLvl(lvl)"
            class="productitem"
            :class="{
              found: getProductStatus(date.products[lvl], product),
              na: qualityScores && !getReportExists(date.products[lvl], product),
            }"
            :key="product.id"
          >
            {{ idToHumanReadable(product.id) }}
            <sup
              class="legacy-label"
              v-if="
                getProductStatus(date.products[lvl], product) && getProductStatus(date.products[lvl], product).legacy
              "
            >
              L
            </sup>
          </li>
          <li
            v-if="lvl === '1b'"
            class="productitem modelitem"
            :class="{
              found: getProductStatus(date.products[lvl], { id: 'model' }),
              na: qualityScores && !getReportExists(date.products[lvl], { id: 'model' }),
            }"
          >
            Model
          </li>
        </ul>
      </section>
    </div>
  </div>
  <div v-else class="loadingoverlay">
    <div class="lds-dual-ring"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { idToHumanReadable } from "../lib";
import { Product } from "../../../backend/src/entity/Product";
import { DataStatusParser, ProductDate, ProductInfo, ProductLevels, ProductYear } from "../lib/DataStatusParser";
import debounce from "debounce";

@Component
export default class ProductAvailabilityVisualization extends Vue {
  @Prop() site!: string;
  @Prop() loadingComplete?: () => void;
  @Prop() legend!: boolean;
  @Prop() dateFrom?: string;
  @Prop() tooltips?: boolean;
  @Prop() qualityScores?: boolean;
  @Prop() dataStatusParser!: DataStatusParser;
  @Prop({ default: 1000 / 60 }) debounceMs!: number;

  apiUrl = process.env.VUE_APP_BACKENDURL;
  years: ProductYear[] = [];
  lvlTranslate: { [key: string]: keyof ProductLevels } = {};
  allProducts: Product[] | null = null;
  currentYear: ProductYear | null = null;
  currentDate: ProductDate | null = null;
  tooltipKey = 0;
  busy = false;
  hover = false;
  tooltipStyle = {
    top: "0px",
    left: "0px",
  };

  idToHumanReadable = idToHumanReadable;
  debounce = debounce;

  mounted() {
    this.years = this.dataStatusParser.years;
    this.lvlTranslate = this.dataStatusParser.lvlTranslate;
    this.allProducts = this.dataStatusParser.allProducts;
    if (this.loadingComplete) this.loadingComplete();
  }

  setCurrentYearDate(year: ProductYear, date: ProductDate, event: MouseEvent) {
    this.tooltipStyle = {
      top: `${event.clientY + 10}px`,
      left: `${event.clientX - 175}px`,
    };
    this.currentDate = date;
    this.currentYear = year;
    this.hover = true;
  }

  debouncedSetCurrentYearDate = debounce(this.setCurrentYearDate, this.debounceMs);
  debouncedHideTooltip = debounce(this.hideTooltip, this.debounceMs);

  hideTooltip() {
    this.hover = false;
  }

  get year() {
    return this.currentYear;
  }

  get date() {
    return this.currentDate;
  }

  filterProductsByLvl(lvl: string) {
    if (!this.allProducts) return null;
    return this.allProducts.filter(({ id }) => this.lvlTranslate[id] == lvl && id != "model");
  }

  getProductStatus(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    if (this.qualityScores && existingProduct) {
      return this.topQuality(existingProduct);
    }
    return existingProduct;
  }

  getReportExists(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    return existingProduct && this.qualityExists(existingProduct);
  }

  get allLevels() {
    return Array.from(new Set(Object.values(this.lvlTranslate))).sort();
  }

  createColorClass(products: ProductLevels) {
    if (this.qualityScores) {
      if (this.noData(products)) return "no-data";
      if (this.allPass(products)) return "all-data";
      if (this.hasSomeTests(products)) return "missing-data";
      return "only-model-data";
    }
    if (this.noData(products)) return "no-data";
    else if (this.onlyModel(products)) return "only-model-data";
    else if (this.weirdModel(products)) return "error-data";
    else if (this.allLvl2(products)) return "all-data";
    else if (this.onlyLegacy(products)) return "only-legacy-data";
    else if (this.missingData(products)) return "all-raw";
    else return "error-data";
  }

  allPass(products: ProductLevels) {
    return (
      products["2"].filter(this.topQuality).length == products["2"].length &&
      products["1c"].filter(this.topQuality).length == products["1c"].length &&
      products["1b"].filter(this.topQuality).length == products["1b"].length
    );
  }

  hasSomeTests(products: ProductLevels) {
    return (
      products["2"].filter(this.qualityExists).length > 0 ||
      products["1c"].filter(this.qualityExists).length > 0 ||
      products["1b"].filter(this.qualityExists).length > 0
    );
  }

  topQuality(prod: ProductInfo) {
    return "qualityScore" in prod && prod.qualityScore === 1;
  }

  qualityExists(prod: ProductInfo) {
    return "qualityScore" in prod && typeof prod.qualityScore === "number";
  }

  allLvl2(products: ProductLevels) {
    return products["2"].filter(this.isNotLegacy).length == 4;
  }

  missingData(products: ProductLevels) {
    return (
      products["2"].filter(this.isNotLegacy).length ||
      products["1c"].filter(this.isNotLegacy).length ||
      products["1b"].filter(this.isNotLegacy).length
    );
  }

  onlyLegacy(products: ProductLevels) {
    return (
      products["2"].every(this.isLegacy) &&
      products["1c"].every(this.isLegacy) &&
      products["1b"].every(this.isLegacyOrModel)
    );
  }

  onlyModel(products: ProductLevels) {
    return (
      products["2"].length == 0 &&
      products["1c"].length == 0 &&
      products["1b"].length == 1 &&
      products["1b"][0].id == "model"
    );
  }

  weirdModel(products: ProductLevels) {
    return products["1b"].filter(this.isModel).length > 1;
  }

  noData(products: ProductLevels) {
    return products["2"].length == 0 && products["1c"].length == 0 && products["1b"].length == 0;
  }

  isLegacy(prod: ProductInfo) {
    return prod.legacy;
  }

  isLegacyOrModel(prod: ProductInfo) {
    return prod.legacy || prod.id == "model";
  }

  isModel(prod: ProductInfo) {
    return prod.id == "model";
  }

  isNotLegacy(prod: ProductInfo) {
    return !this.isLegacy(prod);
  }

  createLinkToSearchPage(date: string, products: ProductLevels): string | undefined {
    if (!this.qualityScores && !this.noData(products)) {
      return `/search/data?site=${this.site}&dateFrom=${date}&dateTo=${date}`;
    }
  }
}
</script>
