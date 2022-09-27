<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

.qualityHeader
  padding-top: 10px

#infoBoxes
  display: flex
  align-items: flex-start

  caption
    font-size: 20px
    caption-side: top
    font-weight: bold
    font-variant-caps: all-small-caps
    color: #212529

.infoBox
  tr
    height: 30px

  th
    padding-right: 15px
    font-weight: normal


.qcSummary
  margin-right: 70px
  margin-left: 30px

  td
    padding-right: 40px
    text-align: center

#testResults
  margin-top: 30px

  .singleTest
    border-bottom: 1px solid silver
    border-top: 1px solid silver

    .description
      max-width: 400px
      padding-left: 30px
      padding-bottom: 15px

  .labels
    td
      font-weight: bold
      min-width: 250px

  .idLabel
    padding-left: 30px
    padding-bottom: 8px

  .descriptionLabel
    padding-left: 30px

  .exceptionsLabel
    padding-left: 20px

  img
    height: 20px
    margin-right: 10px

  th
   vertical-align: top
   padding-top: 15px
   padding-bottom: 15px
   font-weight: normal

  td
    vertical-align: top
    padding-top: 15px

  #exceptions
    margin-left: 20px
    margin-bottom: 15px

  .detailsMissing
    color: gray
    padding-left: 8px

  .variable
    color: #555
    background: white
    font-family: monospace

  .rawData
    padding-right: 10px

#qualityFooter
  padding-top: 30px
  color: gray
</style>

<template>
  <main v-if="!error && qualityResponse">
    <img alt="back" id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()" />
    <header>
      <h2 class="qualityHeader">Quality report</h2>
    </header>

    <div id="infoBoxes">
      <table>
        <Donut :qualityResponse="this.qualityResponse"></Donut>
      </table>
      <table class="qcSummary infoBox">
        <caption>
          QC summary
        </caption>
        <tr>
          <th>Number of tests:</th>
          <td>{{ qualityResponse.tests }}</td>
        </tr>
        <tr>
          <th>Number of errors:</th>
          <td>{{ qualityResponse.errors }}</td>
        </tr>
        <tr>
          <th>Number of warnings:</th>
          <td>{{ qualityResponse.warnings }}</td>
        </tr>
      </table>
      <table class="infoBox">
        <caption>
          File information
        </caption>
        <tr>
          <th>Filename:</th>
          <router-link :to="`/file/${this.uuid}`">
            <td>{{ fileResponse.filename }}</td>
          </router-link>
        </tr>
        <tr>
          <th>Processed:</th>
          <td>{{ humanReadableTimestamp(fileResponse.updatedAt) }}</td>
        </tr>
        <tr>
          <th>CloudnetPy version:</th>
          <td>{{ fileResponse.cloudnetpyVersion }}</td>
        </tr>
        <tr v-if="fileResponse.processingVersion">
          <th>Processing version:</th>
          <td>{{ fileResponse.processingVersion }}</td>
        </tr>
      </table>
    </div>

    <table id="testResults">
      <tr class="labels">
        <td class="idLabel">Test id</td>
        <td class="descriptionLabel">Description</td>
        <td v-if="qualityResponse.errorLevel !== 'pass'" class="exceptionsLabel">Exceptions</td>
      </tr>
      <tr v-for="test in qualityResponse.testReports" :key="test.testId" class="singleTest">
        <th><img :src="getQcIcon(test.result)" alt="" />{{ test.testId }}</th>
        <td class="description">{{ test.description }}</td>
        <template>
          <table id="exceptions">
            <tr v-for="(exp, index) in test.exceptions" :key="exp.result + index">
              <template v-if="Object.keys(exp).length <= 1 || !('message' in exp)">
                <td class="detailsMissing">Test failed without further details.</td>
              </template>
              <template v-else>
                <td>• {{ exp.message }}</td>
              </template>
            </tr>
          </table>
        </template>
      </tr>
    </table>

    <div id="qualityFooter">
      Tests run at {{ humanReadableTimestamp(qualityResponse.timestamp) }} using
      <a href="https://github.com/actris-cloudnet/cloudnetpy-qc">cloudnetpy-qc</a> v{{ qualityResponse.qcVersion }}
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import axios from "axios";
import { humanReadableTimestamp, getQcIcon } from "../lib";
import Donut from "../components/Donut.vue";

interface Test {
  testId: string;
  description: string;
  result: string;
  exceptions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface QualityResponse {
  errorLevel: string;
  qcVersion: string;
  timestamp: Date;
  tests: number;
  errors: number;
  warnings: number;
  testReports: Test[];
}

export interface FileResponse {
  measurementDate: string;
  filename: string;
  cloudnetpyVersion: string;
  processingVersion: string;
  updatedAt: string;
}

@Component({
  components: { Donut },
})
export default class QualityReportView extends Vue {
  @Prop() uuid!: string;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  qualityResponse: QualityResponse | null = null;
  fileResponse: FileResponse | null = null;
  error = false;
  tests = this.qualityResponse?.tests;

  humanReadableTimestamp = humanReadableTimestamp;
  getQcIcon = getQcIcon;

  created() {
    axios
      .get(`${this.apiUrl}files/${this.uuid}`)
      .then(({ data }) => (this.fileResponse = data))
      .catch(() => {
        this.error = true;
      });
    axios
      .get(`${this.apiUrl}quality/${this.uuid}`)
      .then(({ data }) => (this.qualityResponse = data))
      .catch(() => {
        this.error = true;
      });
  }
}
</script>
