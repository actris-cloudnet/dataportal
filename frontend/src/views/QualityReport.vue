<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

#qualitylanding
  .info
    flex-direction: row-reverse

  .description
    font-size: 1.2em
    cursor: pointer
    padding: 0.4em
    width: 1em
  .description::after
    content: '\24D8'

  .tooltip
    position: absolute

  .reltip
    position: relative
    top: 2em
    right: 50%
    background: white
    padding: 1em
    font-family: $content-font
    border: 1px solid grey
    display: inline-block
    max-width: 30em

#metadatatests
  li
    list-style-type: none
    padding-left: 0.3em

  ul
    margin-bottom: 2em
    font-family: monospace

  ul.report
    padding: 0
    margin-bottom: 1em
    li
      padding-left: 0.1em

  li.circled
    list-style-type: '\2717'
    color: darkred

</style>


<template>
  <main id="qualitylanding" v-if="!error && response && qualityResponse">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()">
    <header>
      <h2>Quality report</h2>
      <span>For
      {{ response.product.humanReadableName }} data from
      {{ response.site.humanReadableName }} on
      {{ humanReadableDate(response.measurementDate) }}.
      </span>
    </header>
    <main class="info">
      <div v-if="qualityResponse.overallScore < 1">
        <section id="summary">
          <header>Summary</header>
          <section class="details">
            <dl>
              <dt>Tests run</dt>
              <dd>{{ totalTests }}</dd>
              <dt>Total failed tests</dt>
              <dd>{{ failedTests }}</dd>
              <dt>Failed metadata tests</dt>
              <dd>{{ failedMetadataTests }}</dd>
              <dt>Failed data tests</dt>
              <dd>{{ failedDataTests }}</dd>
            </dl>
          </section>
        </section>
      </div>
      <section id="metadatatests">
        <header>Diagnostics</header>
        <section class="details">
          <h3>Metadata tests</h3>
          <quality-test-result :qualityTestResult="qualityResponse.metadata"></quality-test-result>
          <h3>Data tests</h3>
          <quality-test-result :qualityTestResult="qualityResponse.data"></quality-test-result>
      </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import Map from '../components/Map.vue'
import ProductAvailabilityVisualization from '../components/ProductAvailabilityVisualization.vue'
import {humanReadableDate} from '../lib'
import {DevMode} from '../lib/DevMode'
import QualityTestResult from '../components/QualityTestResult.vue'

Vue.component('quality-test-result', QualityTestResult)

interface Test {
  name: string;
  report: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  description: string;
}

export interface QualityResponse {
  overallScore: number;
  data: Test[];
  metadata: Test[];
}

@Component({
  components: {Map, ProductAvailabilityVisualization}
})
export default class QualityReportView extends Vue {
  @Prop() uuid!: string
  apiUrl = process.env.VUE_APP_BACKENDURL
  response: File | null = null
  qualityResponse: QualityResponse | null = null
  error = false
  busy = true
  devMode = new DevMode()

  humanReadableDate = humanReadableDate

  payload = {developer: this.devMode.activated}
  created() {
    axios
      .get(`${this.apiUrl}files/${this.uuid}`, {params: this.payload})
      .then(({data}) => (this.response = data))
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
    axios
      .get(`${this.apiUrl}quality/${this.uuid}`, {params: this.payload})
      .then(({data}) => (this.qualityResponse = data))
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
  }

  loadingComplete() {
    this.busy = false
  }

  get failedMetadataTests() {
    if (!this.qualityResponse) return null
    return this.qualityResponse.metadata.reduce((acc, cur) => acc + cur.report.length, 0)
  }

  get failedDataTests() {
    if (!this.qualityResponse) return null
    return this.qualityResponse.data.reduce((acc, cur) => acc + cur.report.length, 0)
  }

  get failedTests() {
    return this.failedMetadataTests + this.failedDataTests
  }

  get totalTests() {
    if (!this.qualityResponse) return null
    return Math.round(this.failedTests / (1 - this.qualityResponse.overallScore))
  }
}
</script>
