<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

$lightpadding: 1em
$heavypadding: 5em

main#search
  position: relative
  display: flex
  justify-content: center
  flex-wrap: wrap
  padding-left: $lightpadding
  padding-right: $lightpadding

main#search.mediumView
  max-width: 90em

main#search.wideView
  max-width: none
  padding-left: $heavypadding
  padding-right: $heavypadding

.betanote
  border-color: #ffeecf
  background: #fdfce5

a:focus
  outline: thin dotted

.rednote
  border-color: #ffcfcf
  background: #fde5e5

.close
  float: right
  font-weight: bold
  color: lightgrey
  cursor: pointer
  margin-left: 1em

.rednote>.close
  color: grey
  font-weight: normal

section#sideBar
  margin-right: 80px
  width: 300px

@media screen and (max-width: $narrow-screen)
  section#sideBar
    margin-right: 0
@media screen and (max-width: $medium-screen)
  section#sideBar
    margin-left: 80px
    margin-right: 80px

.multiselect
  margin-bottom: $filter-margin

div.date
  display: grid
  grid-template-columns: 42.5% 15% 42.5%
  justify-items: center
  row-gap: 0.5em
  margin-bottom: $filter-margin
  .date
    outline: none

button.calendar
  display: flex
  align-items: center
  justify-content: center

  width: 2em
  height: 100%
  background-color: $blue-dust
  color: white
  border: 1px solid $steel-warrior
  border-radius: 0 2px 2px 0
  font-size: 1em
  cursor: pointer
  font-family: $content-font
  &:focus
    background-color: $steel-warrior
    outline: none
  &:hover
    background-color: $steel-warrior
  &:active
    background-color: $steel-warrior
    border-color: $blue-dust
  &>svg
    color: black
    width: 1em
    height: 1em

div.keyInfo
  border-style: solid
  border-width: 0.5px
  border-radius: 2px
  grid-column: 1 / 8
  padding: 0.1em
  width: 100%
  border-color: $steel-warrior
  background: $blue-dust
  font-size: 85%
  color: grey
  .infoIcon
    opacity: 0.5
    height: 1.3em
    width: auto
    top: -1.5px
    position: relative
    margin-right: 0.5em
    margin-left: 0.7em

label, span.filterlabel
  font-size: 0.9em
  margin-bottom: 0
  &::after
    content: ':'

#noRes
  font-size: 90%
  color: gray

#reset
  cursor: pointer
  text-decoration: underline
  color: #bcd2e2
  margin-bottom: $filter-margin
  display: block

.disabled
  opacity: 0.5

.hidden
  display: none

.multiselect--disabled
  .multiselect__select
    background: none

.results
  margin-top: 15px
  display: inline-flex
  flex-grow: 1
  min-width: 600px
  flex-basis: 600px

@media screen and (max-width: 1010px)
  .results
    min-width: 0

.widebutton
  width: 100%
  margin: 0 auto $filter-margin

  &:focus
    outline: thin dotted

.no-padding
  padding: 0

.quickselectors
  width: 100%
  height: 27px
  display: flex
  justify-content: space-between
  margin-bottom: 0.6em
  margin-top: 0.6em
  .quickBtn
    color: black
    height: 25px
    padding: 10px
    font-size: 80%
    line-height: 0
    margin-right: 0
    border: 1px solid $steel-warrior
    border-radius: 3px
    background-color: $blue-dust
    &:hover
      background-color: $steel-warrior
    &:focus
      outline: thin dotted
    &:active
      outline: none
  .activeBtn
    background-color: $steel-warrior
    border: 1px solid darkgray
    &:focus
      outline: none

.dateButtons
  width: 80%
  height: 32px
  display: flex
  margin-top: 1.5em
  margin-left: 8.0em
  .dateBtn:disabled
    opacity: 0.5
  .dateBtn:hover:enabled
    background-color: $steel-warrior
  .dateBtn
    padding-left: 10px
    padding-right: 10px
    margin-right: 12px
    border: 1px solid $steel-warrior
    border-radius: 3px
    background-color: $blue-dust
    &:focus
      outline: thin dotted
    .dateIcon
      height: 1.5em
      width: auto
      margin-right: 1.5em
span.centerlabel
  line-height: 30px
  font-size: 80%

.widemap.wideviz
  left: $heavypadding
  right: $heavypadding

.widemapmarginleft
  margin-top: -20px

.widemapmarginright
  margin-top: 450px
@media screen and (max-width: $narrow-screen)
  .widemapmarginright
    margin-top: 0px
@media screen and (max-width: $medium-screen)
  .widemapmarginright
    margin-top: 0px

div.checkbox
  position: relative
  top: -1.5em
  margin-bottom: 1em
  display: flex
  flex-direction: row
  align-items: center
  label
    margin-left: 0.5em
    margin-top: 0
    &::after
      content: ''

.rowtag
  display: inline-block
  min-width: 1em
  min-height: 1em
  font-size: 0.9em
  text-align: center
  padding: 0.2em
  margin-left: 0.5em

.volatile
  background: #cad7ff

.legacy
  background: #cecece
</style>

<template>
  <main v-if="mode === 'visualizations' || mode === 'data'" id="search" v-bind:class="mainWidth">
    <div v-if="devMode.activated" class="note rednote">
      You are using the dataportal in developer mode. Files from sites in testing mode are now visible.
      <span class="close_x" id="disableDevMode" @click="devMode.disable()">Deactivate</span>
    </div>
    <div v-if="error" class="note rednote">Error: Search backend is offline, {{ error }}</div>

    <section id="sideBar">
      <div :class="{ widemap: showAllSites, wideviz: vizWideMode }">
        <Map
          v-if="allSites && allSites.length > 0"
          :key="mapKey"
          :sites="allSites"
          :selectedSiteIds="selectedSiteIds"
          :onMapMarkerClick="onMapMarkerClick"
          :center="[54.0, 14.0]"
          :zoom="showAllSites ? 2 : 3"
          :showLegend="showAllSites"
          :enableBoundingBox="true"
        />
      </div>

      <custom-multiselect
        label="Location"
        v-model="selectedSiteIds"
        :options="allSites"
        id="siteSelect"
        class="nobottommargin"
        :class="{ widemapmarginleft: showAllSites }"
        :icons="true"
        :multiple="true"
        :getIcon="getMarkerIcon"
        :devMode="devMode"
      />
      <div class="checkbox">
        <input type="checkbox" id="showAllSitesCheckbox" name="showAllSitesCheckbox" v-model="showAllSites" />
        <label for="showAllSitesCheckbox">Show all sites</label>
      </div>

      <span class="filterlabel" v-if="!isVizMode()">Date range</span>
      <div class="quickselectors" v-if="!isVizMode()">
        <button
          id="yearBtn"
          class="quickBtn"
          @click="setDateRangeForCurrentYear()"
          :class="{ activeBtn: activeBtn === 'btn1' }"
        >
          Current year
        </button>
        <button
          id="monthBtn"
          class="quickBtn"
          @click="setDateRange(fixedRanges.month)"
          :class="{ activeBtn: activeBtn === 'btn2' }"
        >
          Last 30 days
        </button>
        <button
          id="weekBtn"
          class="quickBtn"
          @click="setDateRange(fixedRanges.day)"
          :class="{ activeBtn: activeBtn === 'btn3' }"
        >
          Today
        </button>
      </div>

      <div class="date" v-if="!isVizMode()">
        <datepicker
          name="dateFrom"
          v-model="dateFrom"
          :dateInput="dateInputStart"
          :start="beginningOfHistory"
          :end="dateTo"
          v-on:error="dateFromError = $event"
          :key="dateFromUpdate"
        ></datepicker>
        <span class="centerlabel">&#8212;</span>
        <datepicker
          name="dateTo"
          v-model="dateTo"
          :dateInput="dateInputEnd"
          :start="dateFrom"
          :end="today"
          v-on:error="dateToError = $event"
          :key="dateToUpdate"
        ></datepicker>
        <div v-if="!isTrueOnBothDateFields('isValidDateString')" class="errormsg">
          Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
        </div>
        <div
          v-if="isTrueOnBothDateFields('isValidDateString') && !isTrueOnBothDateFields('isNotInFuture')"
          class="errormsg"
        >
          Provided date is in the future.
        </div>
        <div
          v-if="
            isTrueOnBothDateFields('isValidDateString') && (!dateFromError.isBeforeEnd || !dateToError.isAfterStart)
          "
          class="errormsg"
        >
          Date from must be before date to.
        </div>
      </div>

      <div class="date" v-if="isVizMode()">
        <datepicker
          label="Date"
          name="dateTo"
          v-model="dateTo"
          :dateInput="visualizationDate"
          :start="beginningOfHistory"
          :end="today"
          v-on:error="dateToError = $event"
          :key="vizDateUpdate"
        ></datepicker>
        <div class="dateButtons">
          <button
            id="previousBtn"
            class="dateBtn"
            @click="setPreviousDate()"
            :disabled="setDateButtonActiveStatus('previous')"
          >
            <img alt="calendar" class="dateIcon" :src="getProductIcon('date-previous')" />
          </button>
          <button id="nextBtn" class="dateBtn" @click="setNextDate()" :disabled="setDateButtonActiveStatus('next')">
            <img alt="calendar" class="dateIcon" :src="getProductIcon('date-next')" />
          </button>
        </div>
        <div v-if="displayKeyInfo" class="keyInfo">
          <img alt="info" class="infoIcon" :src="getProductIcon('info')" />
          Use arrow keys to change dates
          <span class="closeX" @click="hideKeyInfo"> &#10005; </span>
        </div>
        <div v-if="!dateToError.isValidDateString" class="errormsg">
          Invalid input. Insert date in the format <i>yyyy-mm-dd</i>.
        </div>
        <div v-if="dateToError.isValidDateString && !dateToError.isNotInFuture" class="errormsg">
          Provided date is in the future.
        </div>
      </div>

      <custom-multiselect
        label="Product"
        v-model="selectedProductIds"
        :options="allProducts"
        id="productSelect"
        :multiple="true"
        :icons="true"
        :getIcon="getProductIcon"
        :devMode="devMode"
      />
      <div class="checkbox">
        <input type="checkbox" id="showExpProductsCheckbox" name="showExpProductsCheckbox" v-model="showExpProducts" />
        <label for="showExpProductsCheckbox">Show experimental products</label>
      </div>

      <custom-multiselect
        v-show="isVizMode()"
        label="Variable"
        v-model="selectedVariableIds"
        :options="selectableVariables"
        :multiple="true"
        id="variableSelect"
      />

      <button v-if="isVizMode()" @click="navigateToSearch('data')" class="secondaryButton widebutton">
        View in data search &rarr;
      </button>
      <button v-else @click="navigateToSearch('visualizations')" class="secondaryButton widebutton">
        View latest date in visualization search &rarr;
      </button>

      <a @click="reset" id="reset">Reset filter</a>
    </section>

    <div class="results" v-bind:class="{ widemapmarginright: showAllSites }">
      <viz-search-result
        v-if="isVizMode()"
        :apiResponse="apiResponse"
        :isBusy="isBusy"
        :date="dateTo"
        :key="vizSearchUpdate"
        :noSelectionsMade="noSelectionsMade"
        :setWideMode="setVizWideMode"
      >
      </viz-search-result>

      <data-search-result
        v-else
        :apiResponse="apiResponse"
        :isBusy="isBusy"
        :downloadUri="downloadUri"
        :key="dataSearchUpdate"
      >
      </data-search-result>
    </div>
  </main>
  <app-error v-else :response="{ status: 404 }"></app-error>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import VCalendar from "v-calendar";
import axios from "axios";
import { Site } from "../../../backend/src/entity/Site";
import Datepicker from "../components/Datepicker.vue";
import CustomMultiselect, { Option } from "../components/Multiselect.vue";
import DataSearchResult from "../components/DataSearchResult.vue";
import {
  constructTitle,
  dateToString,
  fixedRanges,
  getDateFromBeginningOfYear,
  getProductIcon,
  isSameDay,
  isValidDate,
} from "../lib";
import { DevMode } from "../lib/DevMode";
import VizSearchResult from "../components/VizSearchResult.vue";
import { Visualization } from "../../../backend/src/entity/Visualization";
import { Product } from "../../../backend/src/entity/Product";
import { ProductVariable } from "../../../backend/src/entity/ProductVariable";
import { SearchFileResponse } from "../../../backend/src/entity/SearchFileResponse";
import Map, { getMarkerIcon } from "../components/Map.vue";

Vue.use(VCalendar);

@Component({
  name: "app-search",
  components: { Map, Datepicker, CustomMultiselect, DataSearchResult, VizSearchResult },
})
export default class Search extends Vue {
  @Prop() mode!: string;

  // api call
  apiUrl = process.env.VUE_APP_BACKENDURL;
  apiResponse: SearchFileResponse[] | Visualization[] = this.resetResponse();
  pendingUpdates = false;

  // file list
  isBusy = false;

  // site selector
  normalSites: Site[] = [];
  extraSites: Site[] = [];
  allSites: Site[] = []; // options in site selector
  normalSiteIds: string[] = [];
  extraSiteIds: string[] = [];
  selectedSiteIds: string[] = [];
  showAllSites = false;

  // dates
  beginningOfHistory = new Date("1970-01-01");
  today = new Date();
  dateTo = this.today;
  dateFrom = this.isVizMode() ? this.today : this.getInitialDateFrom();
  dateFromError: { [key: string]: boolean } = {};
  dateToError: { [key: string]: boolean } = {};
  visualizationDate = this.dateTo;
  dateInputStart = this.dateFrom;
  dateInputEnd = this.dateFrom;
  activeBtn = "";

  // products
  normalProducts: Product[] = [];
  experimentalProducts: Product[] = [];
  allProducts: Product[] = []; // options in product selector
  normalProductIds: string[] = [];
  experimentalProductIds: string[] = [];
  selectedProductIds: string[] = [];
  showExpProducts = false;

  // variables
  experimentalVariableIds: string[] = [];
  selectedVariableIds: string[] = [];

  // other
  renderComplete = false;
  displayKeyInfo = this.showKeyInfo();
  vizWideMode = false;
  error = null;
  fixedRanges = fixedRanges;
  devMode = new DevMode();

  // keys
  dateFromUpdate = 10000;
  dateToUpdate = 20000;
  vizDateUpdate = 30000;
  dataSearchUpdate = 40000;
  vizSearchUpdate = 50000;
  mapKey = 60000;

  getProductIcon = getProductIcon;
  getMarkerIcon = getMarkerIcon;

  mounted() {
    this.$nextTick(() => {
      this.renderComplete = true;
    });
    this.addKeyPressListener();
  }

  async created() {
    await this.initView();
    const query = this.$route.query;
    const params = ["site", "product", "variable", "dateFrom", "dateTo"];
    const paramsSet = params.filter((param) => param in query && query[param] != null);
    for (const param of paramsSet) {
      const value = this.$route.query[param] as string;
      if (param === "site") this.selectedSiteIds = this.parseQuery(param, value);
      if (param === "product") this.selectedProductIds = this.parseQuery(param, value);
      if (param === "variable") this.selectedVariableIds = this.parseQuery(param, value);
      if (param === "dateFrom" || param === "dateTo") {
        if (isValidDate(value)) {
          const date = new Date(value);
          this[param] = date;
          param === "dateFrom" ? (this.dateInputStart = date) : (this.dateInputEnd = date);
        }
      }
    }
    if (paramsSet.length === 0) await this.fetchData();
  }

  async initView() {
    const payload = { developer: this.devMode.activated || undefined };
    const sitesPayload = { params: { ...payload, ...{ type: ["cloudnet", "campaign", "arm"] } } };
    await Promise.all([
      axios.get(`${this.apiUrl}sites/`, sitesPayload),
      axios.get(`${this.apiUrl}products/variables`, { params: payload }),
    ]).then(([sites, products]) => {
      this.allSites = sites.data.sort(this.alphabeticalSort).filter(this.selectNormalSites);
      this.normalSites = sites.data.sort(this.alphabeticalSort).filter(this.selectNormalSites);
      this.extraSites = sites.data.sort(this.alphabeticalSort).filter(this.selectExtraSites);
      this.normalSiteIds = this.normalSites.map((site) => site.id);
      this.extraSiteIds = this.extraSites.map((site) => site.id);
      this.allProducts = products.data.filter(this.discardExperimentalProducts).sort(this.alphabeticalSort);
      this.normalProducts = products.data.filter((prod: Product) => !prod.experimental).sort(this.alphabeticalSort);
      this.experimentalProducts = products.data
        .filter((prod: Product) => prod.experimental)
        .sort(this.alphabeticalSort);
      this.normalProductIds = this.normalProducts.map((prod) => prod.id);
      this.experimentalProductIds = this.experimentalProducts.map((prod) => prod.id);
      this.experimentalVariableIds = this.experimentalProducts.flatMap((prod) => prod.variables).map((prod) => prod.id);
    });
  }

  parseQuery(param: string, value: string): string[] {
    let validChoices: string | string[];
    const valueArray = value.split(",");
    if (param === "product") {
      for (const productId of valueArray) {
        if (this.experimentalProductIds.includes(productId) && !this.showExpProducts) {
          this.showExpProducts = true;
          this.allProducts = this.normalProducts.concat(this.experimentalProducts);
        }
      }
      validChoices = this.normalProductIds.concat(this.experimentalProductIds);
    }
    if (param === "site") {
      for (const siteId of valueArray) {
        if (this.extraSiteIds.includes(siteId) && !this.showAllSites) {
          this.showAllSites = true;
          this.allSites = this.normalSites.concat(this.extraSites);
        }
      }
      validChoices = this.allSites.map((site) => site.id);
    }
    if (param === "variable") {
      validChoices = this.allProducts.flatMap((prod) => prod.variables).map((variable) => variable.id);
    }
    const validValues = valueArray.filter((value) => validChoices.includes(value));
    return Array.from(new Set(validValues));
  }

  fetchData() {
    if (this.pendingUpdates) return Promise.resolve();
    this.pendingUpdates = true;
    return new Promise((resolve, reject) => {
      this.$nextTick(() => {
        this.pendingUpdates = false;
        if (this.isVizMode() && this.noSelectionsMade) {
          resolve(undefined);
          return;
        }
        this.isBusy = true;
        const apiPath = this.isVizMode() ? "visualizations/" : "search/";
        if (!this.isVizMode()) this.checkIfButtonShouldBeActive();
        return axios
          .get(`${this.apiUrl}${apiPath}`, this.payload)
          .then((res) => {
            this.apiResponse = constructTitle(res.data);
            this.isBusy = false;
            resolve(undefined);
          })
          .catch((err) => {
            this.error = err.response.statusText || "unknown error";
            this.apiResponse = this.resetResponse();
            this.isBusy = false;
            reject();
          });
      });
    });
  }

  dateErrorsExist(dateError: { [key: string]: boolean }) {
    return !(dateError.isValidDateString && dateError.isAfterStart && dateError.isBeforeEnd && dateError.isNotInFuture);
  }

  setSelectedProductIds(productIds: []) {
    this.selectedProductIds = productIds;
  }

  setSelectedVariableIds(variableIds: []) {
    this.selectedVariableIds = variableIds;
  }

  getInitialDateFrom() {
    const date = new Date();
    return new Date(date.setDate(date.getDate() - fixedRanges.day));
  }

  isVizMode() {
    return this.mode == "visualizations";
  }

  setVizWideMode(wide: boolean) {
    this.vizWideMode = wide;
    this.mapKey = this.mapKey + 1;
  }

  isTrueOnBothDateFields(errorId: string) {
    return (this.isVizMode() || this.dateFromError[errorId]) && this.dateToError[errorId];
  }

  onMapMarkerClick(ids: string[]) {
    const union = this.selectedSiteIds.concat(ids);
    const intersection = this.selectedSiteIds.filter((id) => ids.includes(id));
    this.selectedSiteIds = union.filter((id) => !intersection.includes(id));
  }

  alphabeticalSort = (a: Option, b: Option) => a.humanReadableName > b.humanReadableName;

  selectNormalSites = (site: Site) => (site.type as string[]).includes("cloudnet");

  selectExtraSites = (site: Site) => !(site.type as string[]).includes("cloudnet");

  discardExperimentalProducts(prod: Product) {
    return this.showExpProducts || !prod.experimental;
  }

  resetResponse() {
    return [];
  }

  navigateToSearch(mode: string) {
    this.$router.push({ name: "Search", params: { mode }, query: this.$route.query }).catch(() => {
      // Ignore useless error when URL doesn't change.
    });
  }

  reset() {
    this.$router.replace({ path: this.$route.path, query: {} }).catch(() => {
      // Ignore useless error when URL doesn't change.
    });
    this.$router.go(0);
  }

  setDateRange(n: number) {
    this.dateInputEnd = new Date();
    const date = new Date();
    date.setDate(date.getDate() - n);
    this.dateInputStart = date;
  }

  setDateRangeForCurrentYear() {
    this.dateInputEnd = new Date();
    this.dateInputStart = getDateFromBeginningOfYear();
  }

  addKeyPressListener() {
    window.addEventListener("keydown", (e) => {
      if (document.activeElement === null) {
        if (e.code == "ArrowLeft") this.setPreviousDate();
        if (e.code == "ArrowRight") this.setNextDate();
      } else {
        const element = document.activeElement;
        const input = "INPUT";
        if (input != element.tagName) {
          if (e.code == "ArrowLeft") this.setPreviousDate();
          if (e.code == "ArrowRight") this.setNextDate();
        }
      }
    });
  }

  setPreviousDate() {
    if (this.dateTo > this.beginningOfHistory) {
      const date = this.dateTo;
      date.setDate(date.getDate() - 1);
      this.visualizationDate = date;
      this.dateTo = date;
    }
  }

  setNextDate() {
    if (!isSameDay(this.dateTo, new Date())) {
      const date = this.dateTo;
      date.setDate(date.getDate() + 1);
      this.visualizationDate = date;
      this.dateTo = date;
    }
  }

  checkIfButtonShouldBeActive() {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((this.dateTo.valueOf() - this.dateFrom.valueOf()) / oneDay));
    const isDateToToday = isSameDay(this.dateTo, new Date());
    const isDateFromBeginningOfYear = isSameDay(new Date(this.dateFrom), getDateFromBeginningOfYear());
    if (isDateToToday && isDateFromBeginningOfYear) this.activeBtn = "btn1";
    else if (isDateToToday && diffDays === fixedRanges.month) this.activeBtn = "btn2";
    else if (isDateToToday && diffDays === fixedRanges.day) this.activeBtn = "btn3";
    else this.activeBtn = "";
  }

  setDateButtonActiveStatus(name: string) {
    const isDateToday = isSameDay(this.visualizationDate, new Date());
    const isDateLatest = isSameDay(this.visualizationDate, this.beginningOfHistory);
    if (name == "next") {
      if (isDateToday) return true;
    } else {
      if (isDateLatest) return true;
    }
    return false;
  }

  replaceUrlQueryString(param: string, value: Date | string[]) {
    const query = { ...this.$route.query };
    const valueToUrl = value instanceof Date ? dateToString(value) : value.join(",");
    query[param] = valueToUrl === "" ? [] : valueToUrl;
    this.$router.replace({ path: this.$route.path, query: query }).catch(() => {
      // Ignore useless error when URL doesn't change.
    });
  }

  showKeyInfo() {
    return localStorage.getItem("hideInfoBox") !== "1";
  }

  hideKeyInfo() {
    localStorage.setItem("hideInfoBox", "1");
    this.displayKeyInfo = false;
  }

  get downloadUri() {
    return axios.getUri({ ...{ method: "post", url: `${this.apiUrl}download/` }, ...this.payload });
  }

  get payload() {
    return {
      params: {
        site: this.selectedSiteIds.length ? this.selectedSiteIds : this.allSites.map((site) => site.id),
        dateFrom: this.isVizMode() ? this.dateTo : this.dateFrom,
        dateTo: this.dateTo,
        product: this.selectedProductIds.length ? this.selectedProductIds : this.allProducts.map((prod) => prod.id),
        variable: this.isVizMode() ? this.selectedVariableIds : undefined,
        showLegacy: true,
        developer: this.devMode.activated || undefined,
      },
    };
  }

  get mainWidth() {
    if (this.isVizMode()) {
      if (this.vizWideMode) return { wideView: true };
      else return { mediumView: true };
    }
    return { narrowView: true };
  }

  get selectableVariables(): ProductVariable[] {
    if (this.selectedProductIds.length == 0) return this.allProducts.flatMap((prod) => prod.variables);
    return this.allProducts
      .filter((prod) => this.selectedProductIds.includes(prod.id))
      .flatMap((prod) => prod.variables);
  }

  get noSelectionsMade() {
    return !(this.selectedProductIds.length || this.selectedSiteIds.length || this.selectedVariableIds.length);
  }

  @Watch("selectedSiteIds")
  async onSiteSelected() {
    this.replaceUrlQueryString("site", this.selectedSiteIds);
    await this.fetchData();
  }

  @Watch("dateFrom")
  async onDateFromChanged() {
    if (!this.renderComplete || this.dateErrorsExist(this.dateFromError)) return;
    this.replaceUrlQueryString("dateFrom", this.dateFrom);
    await this.fetchData();
  }

  @Watch("dateTo")
  async onDateToChanged() {
    if (!this.renderComplete || this.dateErrorsExist(this.dateToError)) return;
    if (this.isVizMode()) {
      this.dateFrom = this.dateTo;
      this.visualizationDate = new Date(this.dateTo);
    }
    this.replaceUrlQueryString("dateTo", this.dateTo);
    this.replaceUrlQueryString("dateFrom", this.dateFrom);
    await this.fetchData();
  }

  @Watch("selectedProductIds")
  async onProductSelected() {
    this.replaceUrlQueryString("product", this.selectedProductIds);
    await this.fetchData();
  }

  @Watch("selectedVariableIds")
  async onVariableSelected() {
    this.replaceUrlQueryString("variable", this.selectedVariableIds);
    await this.fetchData();
  }

  @Watch("showLegacy")
  async onShowLegacy() {
    await this.fetchData();
  }

  @Watch("devMode.activated")
  async onDevModeToggled() {
    await this.initView();
    this.mapKey = this.mapKey + 1;
  }

  @Watch("showAllSites")
  async onShowAllSites() {
    if (!this.showAllSites) {
      // remove selected campaign and arm sites
      this.allSites = this.normalSites;
      this.selectedSiteIds = this.selectedSiteIds.filter((site) => !this.extraSiteIds.includes(site));
    } else {
      this.allSites = this.normalSites.concat(this.extraSites);
    }
    this.mapKey = this.mapKey + 1;
    await this.fetchData();
  }

  @Watch("showExpProducts")
  async onShowExpProducts() {
    if (!this.showExpProducts) {
      // remove selected experimental products and variables
      this.allProducts = this.normalProducts;
      this.selectedProductIds = this.selectedProductIds.filter((prod) => !this.experimentalProductIds.includes(prod));
      this.selectedVariableIds = this.selectedVariableIds.filter(
        (variable) => !this.experimentalVariableIds.includes(variable)
      );
    } else {
      this.allProducts = this.normalProducts.concat(this.experimentalProducts);
    }
    await this.fetchData();
  }

  @Watch("allProducts")
  async onSelectedL3Product() {
    this.showExpProducts = this.allProducts.length > this.normalProducts.length;
  }

  @Watch("mode")
  async onModeChange() {
    this.renderComplete = false;
    this.apiResponse = this.resetResponse();
    this.dateFromUpdate = this.dateFromUpdate += 1;
    this.dateToUpdate = this.dateToUpdate += 1;
    this.vizDateUpdate = this.vizDateUpdate += 1;
    this.dataSearchUpdate = this.dataSearchUpdate += 1;
    this.vizSearchUpdate = this.vizSearchUpdate += 1;
    this.mapKey = this.mapKey += 1;
    await this.fetchData();
    this.renderComplete = true;
  }
}
</script>
