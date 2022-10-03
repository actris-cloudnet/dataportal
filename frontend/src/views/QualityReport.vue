<style lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

.qualityHeader
  padding-top: 10px

#infoBoxes
  display: flex
  flex-wrap: wrap

  caption
    font-size: 20px
    caption-side: top
    font-weight: bold
    font-variant-caps: all-small-caps
    color: #212529

  .flexitem
    margin-left: 10px
    margin-right: 10px

.infoBox
  tr
    height: 30px

  th
    padding-right: 15px
    font-weight: normal

  .missingInfo
    color: gray

.qcSummary
  margin-right: 30px
  td
    text-align: center

#testResults
  margin-top: 30px

  .labels
    td
      font-weight: bold
      min-width: 250px

  .idLabel
    padding-left: 30px
    padding-bottom: 8px

  img
    height: 20px
    margin-right: 10px
    margin-top: -4px

  th, td
    padding: 15px

  tr
    border-bottom: 1px solid #ddd

  thead tr
    border-bottom-width: 2px

  tbody th
    font-weight: inherit
    vertical-align: top
    padding-left: 0

  td
    vertical-align: middle

  ul
    padding: 0
    margin: 0

  li + li
    margin-top: 5px

  .detailsMissing
    color: gray
    padding-left: 8px

  .title
    font-weight: 600

  .description
    color: gray
    max-width: 400px
    padding-left: 30px

  code
    font-size: 90%

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
      <div class="flexitem">
        <table>
          <Donut :qualityResponse="this.qualityResponse"></Donut>
        </table>
      </div>
      <div class="flexitem">
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
      </div>
      <div class="flexitem">
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
            <td v-if="fileResponse.cloudnetpyVersion">{{ fileResponse.cloudnetpyVersion }}</td>
            <td v-else class="missingInfo">n/a</td>
          </tr>
          <tr v-if="fileResponse.processingVersion">
            <th>Processing version:</th>
            <td v-if="fileResponse.processingVersion">{{ fileResponse.processingVersion }}</td>
            <td v-else class="missingInfo">n/a</td>
          </tr>
        </table>
      </div>
    </div>

    <table id="testResults">
      <thead>
        <tr class="labels">
          <th class="idLabel">Test</th>
          <th v-if="qualityResponse.errorLevel !== 'pass'" class="exceptionsLabel">Issues</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="test in qualityResponse.testReports" :key="test.testId" class="singleTest">
          <th>
            <div class="title"><img :src="getQcIcon(test.result)" alt="" />{{ test.testId }}</div>
            <div class="description" v-html="formatMessage(test.description)"></div>
          </th>
          <td>
            <ul>
              <li v-for="(exp, index) in test.exceptions" :key="exp.result + index">
                <template v-if="Object.keys(exp).length <= 1 || !('message' in exp)">
                  <span class="detailsMissing">Test failed without further details.</span>
                </template>
                <template v-else>
                  <span v-html="formatMessage(exp.message)"></span>
                </template>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
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
import escapeHtml from "escape-html";

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

  formatMessage(message: string): string {
    // Try to format anything that looks like an identifier (snake case, in
    // single quotes).
    return escapeHtml(message).replace(/&#39;(\w+)&#39;|(\w+_\w+)/gi, "<code>$1$2</code>");
  }

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
