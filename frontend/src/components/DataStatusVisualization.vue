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

.legacy-label
  color: grey

.dataviz-tooltip
  position: fixed
  z-index: 6
  background: white
  padding: .75em 1em
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2)
  border-radius: 8px

  section
    display: flex
    justify-content: space-between
    font-size: 0.9em
    margin-top: .5em

    ul
      padding: 0
      list-style: none
      white-space: pre-wrap
      margin-bottom: 0

      li.header
        font-weight: bold

      li.modelitem
        margin-top: 0.8em

      // Product availability:

      li.productitem::before
        content: '    '
        background-repeat: no-repeat
        background-position: center
        background-size: contain

      li.productitem.found::before
        background-image: url('../assets/icons/test-pass.svg')

      li.productitem:not(.found)::before
        background-image: url('../assets/icons/test-missing.svg')

      // Quality:

      li.qualityitem::before
        content: '    '
        background-repeat: no-repeat
        background-position: center
        background-size: contain

      li.qualityitem:not(.found).na::before
        background-image: url('../assets/icons/test-missing.svg')

      li.qualityitem:not(.found)::before
        background-image: url('../assets/icons/test-fail.svg')

      li.qualityitem.found::before
        background-image: url('../assets/icons/test-pass.svg')

      li.qualityitem.info::before
        background-image: url('../assets/icons/test-info.svg')

      li.qualityitem.warning::before
        background-image: url('../assets/icons/test-warning.svg')

      li.qualityitem.error::before
        background-image: url('../assets/icons/test-fail.svg')


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
        <template v-if="parseInt(year['year']) - parseInt(years[index - 1]['year']) == -2">
          No data for year {{ parseInt(year["year"]) + 1 }}.
        </template>
        <template v-else>
          No data for years {{ parseInt(year["year"]) + 1 }} - {{ parseInt(years[index - 1]["year"]) - 1 }}.
        </template>
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
      <br />
      <div class="legendexpl">
        <span class="legacy-label"><sup>L</sup></span> Legacy
      </div>
    </div>
    <div class="dav-legend" v-if="legend && qualityScores">
      <div class="legendexpl">
        <div class="all-data legendcolor"></div>
        L2 pass
      </div>
      <div class="legendexpl">
        <div class="all-raw legendcolor"></div>
        L2 warnings
      </div>
      <div class="legendexpl">
        <div class="contains-errors legendcolor"></div>
        L2 errors
      </div>
      <div class="legendexpl">
        <div class="only-legacy-data legendcolor"></div>
        Legacy L2
      </div>
      <div class="legendexpl">
        <div class="only-model-data legendcolor"></div>
        Products / tests missing
      </div>
      <div class="legendexpl">
        <div class="no-data legendcolor"></div>
        No data
      </div>
      <br />
      <div class="legendexpl">
        <span class="legacy-label"><sup>L</sup></span> Legacy
      </div>
    </div>
    <div class="dataviz-tooltip" v-if="tooltips && hover" :style="tooltipStyle">
      <header>{{ year["year"] }}-{{ date["date"] }}</header>
      <section v-if="!qualityScores">
        <ul v-for="lvl in allLevels">
          <li class="header">Level {{ lvl }}</li>
          <li
            v-for="product in filterProductsByLvl(lvl)"
            class="productitem"
            :class="{
              found: getProductStatus(date.products[lvl], product),
            }"
            :key="product.id"
          >
            {{ idToHumanReadable(product.id) }}
            <sup class="legacy-label" v-if="isLegacyFile(date.products[lvl], product)">L</sup>
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

      <section v-else>
        <ul v-for="lvl in allLevels">
          <li class="header">Leveli {{ lvl }}</li>
          <li
            v-for="product in filterProductsByLvl(lvl)"
            class="qualityitem"
            :class="{
              found: getProductStatus(date.products[lvl], product),
              na: qualityScores && !getReportExists(date.products[lvl], product),
              info: isFileWithInfo(date.products[lvl], product),
              warning: isFileWithWarning(date.products[lvl], product),
              error: isFileWithError(date.products[lvl], product),
            }"
            :key="product.id"
          >
            {{ idToHumanReadable(product.id) }}
            <sup class="legacy-label" v-if="isLegacyFile(date.products[lvl], product)">L</sup>
          </li>
          <li
            v-if="lvl === '1b'"
            class="qualityitem modelitem"
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

export type ColorClass =
  | "no-data"
  | "only-legacy-data"
  | "contains-errors"
  | "contains-warnings"
  | "only-model-data"
  | "all-data"
  | "all-raw"
  | "contains-info";

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
  busy = false;
  hover = false;
  tooltipStyle: Record<string, string> = {};

  idToHumanReadable = idToHumanReadable;
  debounce = debounce;

  mounted() {
    this.years = this.dataStatusParser.years;
    this.lvlTranslate = this.dataStatusParser.lvlTranslate;
    this.allProducts = this.dataStatusParser.allProducts;
    if (this.loadingComplete) this.loadingComplete();
  }

  setCurrentYearDate(year: ProductYear, date: ProductDate, event: MouseEvent) {
    const tooltipWidth = 420;
    const tooltipMargin = 10;
    this.tooltipStyle = {
      width: tooltipWidth + "px",
      top: event.clientY + 10 + "px",
      left:
        Math.min(
          Math.max(tooltipMargin, event.clientX - tooltipWidth / 2),
          document.body.scrollWidth - tooltipWidth - tooltipMargin
        ) + "px",
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

  isLegacyFile(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    if (existingProduct) {
      return existingProduct.legacy;
    }
  }

  isFileWithWarning(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    if (existingProduct) {
      return this.isWarning(existingProduct);
    }
  }

  isFileWithInfo(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    if (existingProduct) {
      return this.isInfo(existingProduct);
    }
  }

  isFileWithError(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    if (existingProduct) {
      return this.isError(existingProduct);
    }
  }

  getReportExists(existingProducts: ProductInfo[], product: Product) {
    const existingProduct = existingProducts.find((prod) => prod.id == product.id);
    return existingProduct && this.qualityExists(existingProduct);
  }

  get allLevels() {
    return Array.from(new Set(Object.values(this.lvlTranslate))).sort();
  }

  createColorClass(products: ProductLevels): ColorClass {
    if (this.noData(products)) return "no-data";
    if (this.qualityScores) {
      if (this.hasSomeLevel2Tests(products) && this.onlyLegacyLevel2(products)) return "only-legacy-data";
      if (this.allLevel2Pass(products)) return "all-data";
      if (this.level2ContainsErrors(products)) return "contains-errors";
      if (this.level2containsWarnings(products)) return "all-raw";
      return "only-model-data";
    }
    if (this.onlyModel(products)) return "only-model-data";
    if (this.onlyLegacy(products)) return "only-legacy-data";
    if (this.allLvl2(products)) return "all-data";
    if (this.missingData(products)) return "all-raw";
    return "contains-errors";
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

  hasSomeLevel2Tests(products: ProductLevels) {
    return products["2"].filter(this.qualityExists).length > 0;
  }

  level2ContainsErrors(products: ProductLevels) {
    return products["2"].filter(this.isError).length > 0;
  }

  level2containsWarnings(products: ProductLevels) {
    return products["2"].filter(this.isWarning).length > 0;
  }

  anyProductContainsErrors(products: ProductLevels) {
    return (
      products["2"].filter(this.isError).length > 0 ||
      products["1c"].filter(this.isError).length > 0 ||
      products["1b"].filter(this.isError).length > 0
    );
  }

  anyProductContainsWarnings(products: ProductLevels) {
    return (
      products["2"].filter(this.isWarning).length > 0 ||
      products["1c"].filter(this.isWarning).length > 0 ||
      products["1b"].filter(this.isWarning).length > 0
    );
  }

  anyProductContainsInfo(products: ProductLevels) {
    return (
      products["2"].filter(this.isInfo).length > 0 ||
      products["1c"].filter(this.isInfo).length > 0 ||
      products["1b"].filter(this.isInfo).length > 0
    );
  }

  allLevel2Pass(products: ProductLevels): boolean {
    return products["2"].filter(this.topQuality).length == 4;
  }

  topQuality(prod: ProductInfo): boolean {
    return "errorLevel" in prod && prod.errorLevel === "pass";
  }

  isError(prod: ProductInfo): boolean {
    return "errorLevel" in prod && prod.errorLevel === "error";
  }

  isWarning(prod: ProductInfo): boolean {
    return "errorLevel" in prod && prod.errorLevel === "warning";
  }

  isInfo(prod: ProductInfo): boolean {
    return "errorLevel" in prod && prod.errorLevel === "info";
  }

  qualityExists(prod: ProductInfo): boolean {
    return "errorLevel" in prod && prod.errorLevel !== null;
  }

  allLvl2(products: ProductLevels): boolean {
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

  onlyLegacyLevel2(products: ProductLevels) {
    return products["2"].length > 0 && products["2"].every(this.isLegacy);
  }

  onlyModel(products: ProductLevels) {
    return (
      products["2"].length == 0 &&
      products["1c"].length == 0 &&
      products["1b"].length == 1 &&
      products["1b"][0].id == "model"
    );
  }

  noData(products: ProductLevels): boolean {
    return products["2"].length == 0 && products["1c"].length == 0 && products["1b"].length == 0;
  }

  isLegacy(prod: ProductInfo): boolean {
    return prod.legacy;
  }

  isLegacyOrModel(prod: ProductInfo): boolean {
    return prod.legacy || prod.id == "model";
  }

  isNotLegacy(prod: ProductInfo): boolean {
    return !this.isLegacy(prod);
  }

  createLinkToSearchPage(date: string, products: ProductLevels): string | undefined {
    if (!this.qualityScores && !this.noData(products)) {
      return `/search/data?site=${this.site}&dateFrom=${date}&dateTo=${date}`;
    }
  }
}
</script>
