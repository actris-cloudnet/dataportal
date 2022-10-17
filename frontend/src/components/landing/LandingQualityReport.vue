<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-quality-report-container">
    <div v-if="qualityResponse" class="quality-report-box">
      <div class="quality-report-header">
        <div class="donut">
          <Donut :data="donutData" />
        </div>
        <div class="quality-report-stats">
          <div class="header" id="tests">Tests</div>
          <div class="data" id="ntests">{{ qualityResponse.tests }}</div>
          <div class="header" id="warnings">Warnings</div>
          <div class="data" id="nwarnings">{{ qualityResponse.warnings }}</div>
          <div class="header" id="errors">Errors</div>
          <div class="data" id="nerrors">{{ qualityResponse.errors }}</div>
        </div>
      </div>
      <div class="quality-software">
        Tested with
        <a :href="`https://github.com/actris-cloudnet/cloudnetpy-qc/tree/v${qualityResponse.qcVersion}`">
          CloudnetPy-QC v{{ qualityResponse.qcVersion }}
        </a>
        at
        {{ humanReadableTimestamp(qualityResponse.timestamp) }}
      </div>
      <div class="quality-test-list-header">Tests</div>
      <div class="quality-test-list">
        <div class="quality-test" v-for="test in qualityResponse.testReports" :key="test.testId">
          <div class="quality-test-icon">
            <img :src="getQcIcon(test.result)" alt="" />
          </div>
          <div class="quality-test-id">{{ test.testId }}</div>
          <div v-if="qualityResponse" class="quality-test-description" v-html="formatMessage(test.description)"></div>
          <ul class="quality-test-exception-list">
            <li
              v-for="(exception, i) in test.exceptions"
              :key="exception.result + i"
              :class="['quality-test-exception', 'quality-test-exception-' + exception.result]"
            >
              <div v-if="Object.keys(exception).length <= 1 || !('message' in exception)">test failed</div>
              <div v-else v-html="formatMessage(exception.message)"></div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="quality-report-box quality-report-box-loading">Loading...</div>
  </div>
</template>
<script lang="ts">
import axios from "axios";

import { Component, Prop, Vue } from "vue-property-decorator";

import { QualityResponse, FileResponse } from "../../views/QualityReport.vue";
import Donut, { DonutData } from "../Donut.vue";
import { humanReadableTimestamp, getQcIcon } from "../../lib";
import escapeHtml from "escape-html";

@Component({ components: { Donut } })
export default class LandingQualityReport extends Vue {
  @Prop() uuid!: string;
  apiUrl = process.env.VUE_APP_BACKENDURL;
  fileResponse: FileResponse | null = null;
  qualityResponse: QualityResponse | null = null;
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

  get donutData(): DonutData[] {
    if (!this.qualityResponse) return [];
    return [
      {
        value: this.qualityResponse.tests - this.qualityResponse.warnings - this.qualityResponse.errors,
        color: "#4C9A2A",
      },
      { value: this.qualityResponse.warnings, color: "goldenrod" },
      { value: this.qualityResponse.errors, color: "#cd5c5c" },
    ];
  }

  formatMessage(message: string): string {
    // Try to format anything that looks like an identifier (snake case, in
    // single quotes).
    return escapeHtml(message).replace(/&#39;(\w+)&#39;|(\w+_\w+)/gi, "<code>$1$2</code>");
  }
}
</script>
