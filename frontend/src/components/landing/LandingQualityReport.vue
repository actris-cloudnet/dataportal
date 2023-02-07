<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div class="landing-quality-report-container">
    <div v-if="report.status === 'loading'" class="quality-report-box quality-report-box-loading">Loading...</div>
    <div v-else-if="report.status === 'notFound'" class="quality-report-box quality-report-box-loading">
      No quality report available.
    </div>
    <div v-else-if="report.status === 'error'" class="quality-report-box" style="color: red">
      Failed to load report.
    </div>
    <div v-else class="quality-report-box">
      <div class="quality-report-header">
        <div class="donut">
          <Donut :data="donutData" />
        </div>
        <div class="quality-report-stats">
          <div class="header" id="tests">Tests</div>
          <div class="data" id="ntests">{{ report.value.tests }}</div>
          <div class="header" id="info">Info</div>
          <div class="data" id="ninfo">{{ report.value.info }}</div>
          <div class="header" id="warnings">Warnings</div>
          <div class="data" id="nwarnings">{{ report.value.warnings }}</div>
          <div class="header" id="errors">Errors</div>
          <div class="data" id="nerrors">{{ report.value.errors }}</div>
        </div>
      </div>
      <div class="quality-software">
        Tested with
        <a :href="`https://github.com/actris-cloudnet/cloudnetpy-qc/tree/v${report.value.qcVersion}`">
          CloudnetPy-QC v{{ report.value.qcVersion }}
        </a>
        at
        {{ humanReadableTimestamp(report.value.timestamp) }}
      </div>
      <div class="quality-test-list-header">Tests</div>
      <div class="quality-test-list">
        <div class="quality-test" v-for="test in report.value.testReports" :key="test.testId">
          <div class="quality-test-icon">
            <img :src="getQcIcon(test.result)" alt="" />
          </div>
          <div class="quality-test-id">{{ test.name }}</div>
          <div v-if="test.description" class="quality-test-description" v-html="formatMessage(test.description)"></div>
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
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import escapeHtml from "escape-html";
import { computed, ref, watch } from "vue";

import Donut from "../Donut.vue";
import { humanReadableTimestamp, getQcIcon } from "../../lib";

interface Props {
  uuid: string;
}

const props = defineProps<Props>();

interface Exception {
  result: string;
  message: string;
}

interface Test {
  testId: string;
  name: string;
  description: string | null;
  result: string;
  exceptions: Exception[];
}

interface QualityResponse {
  errorLevel: string;
  qcVersion: string;
  timestamp: Date;
  tests: number;
  errors: number;
  warnings: number;
  info: number;
  testReports: Test[];
}

type QualityResult =
  | { status: "loading" }
  | { status: "ready"; value: QualityResponse }
  | { status: "notFound" }
  | { status: "error" };

const report = ref<QualityResult>({ status: "loading" });

watch(
  () => props.uuid,
  async () => {
    try {
      const response = await axios.get(`${process.env.VUE_APP_BACKENDURL}quality/${props.uuid}`);
      report.value = { status: "ready", value: response.data };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        report.value = { status: "notFound" };
      } else {
        report.value = { status: "error" };
      }
    }
  },
  { immediate: true }
);

const donutData = computed(() => {
  if (report.value.status !== "ready") return [];
  return [
    {
      value:
        report.value.value.tests - report.value.value.warnings - report.value.value.errors - report.value.value.info,
      color: "#4C9A2A",
    },
    { value: report.value.value.warnings, color: "goldenrod" },
    { value: report.value.value.errors, color: "#cd5c5c" },
    { value: report.value.value.info, color: "#98BADB" },
  ];
});

function formatMessage(message: string): string {
  // Try to format anything that looks like an identifier (snake case, in single
  // quotes).
  return escapeHtml(message).replace(/&#39;(\w+)&#39;|(\w+_\w+)/gi, "<code>$1$2</code>");
}
</script>
