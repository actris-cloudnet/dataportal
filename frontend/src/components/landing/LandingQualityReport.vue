<template>
  <div class="landing-quality-report-container">
    <div class="summary-box" :class="{ obsolete: file.tombstoneReason }">
      <BaseSpinner v-if="report.status === 'loading'" />
      <div v-else-if="report.status === 'notFound'">No quality report available.</div>
      <div v-else-if="report.status === 'error'" style="color: red">Failed to load report.</div>
      <div v-else>
        <div class="quality-report-header">
          <div class="donut">
            <Donut :data="donutData" />
          </div>
          <DonutLegend
            :data="[
              {
                label: 'Tests',
                value: report.value.tests,
              },
              { label: 'Errors', value: report.value.errors },
              { label: 'Warnings', value: report.value.warnings },
              { label: 'Info', value: report.value.info },
            ]"
          />
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
            <img class="quality-test-icon" :src="getQcIcon(test.result)" alt="" />
            <div class="quality-test-id">{{ test.name }}</div>
            <div
              v-if="test.description"
              class="quality-test-description"
              v-html="formatMessage(test.description)"
            ></div>
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
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import escapeHtml from "escape-html";
import { computed, ref, watch } from "vue";

import Donut from "@/components/DonutVisualization.vue";
import DonutLegend from "@/components/DonutLegend.vue";
import { humanReadableTimestamp, getQcIcon, backendUrl } from "@/lib";
import { useTitle } from "@/router";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { FileResponse } from "@/views/FileView.vue";

export interface Props {
  uuid: string;
  title: string;
  file: FileResponse;
}

const props = defineProps<Props>();

useTitle(["Quality report", props.title]);

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
      const response = await axios.get(`${backendUrl}quality/${props.uuid}`);
      report.value = { status: "ready", value: response.data };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        report.value = { status: "notFound" };
      } else {
        report.value = { status: "error" };
      }
    }
  },
  { immediate: true },
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

<style scoped lang="scss">
@use "@/sass/variables.scss";

.landing-quality-report-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.quality-software {
  max-inline-size: max-content;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 0.5rem;
  font-size: 90%;
}

.quality-report-header {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  border-bottom: thin solid rgba(0, 0, 0, 0.2);
  padding: 0 0 1rem;
  column-gap: 2rem;

  .donut {
    margin-right: 4rem;
  }
}

.quality-test-description {
  color: variables.$gray4;
}

.quality-test-list-header {
  padding: 1rem 0 1rem;
  font-size: 140%;
  font-weight: 400;
}

.quality-test-list {
  display: flex;
  flex-direction: column;

  .quality-test {
    display: grid;
    grid-template-columns: fit-content(40px) 1fr;
    margin-bottom: 1rem;

    .quality-test-icon {
      grid-column: 1;
      margin: 0 2rem 0 1rem;
      height: 20px;
      width: 20px;
      align-self: center;
    }

    .quality-test-id {
      grid-column: 2;
      font-size: 120%;
      font-weight: 400;
    }

    .quality-test-description {
      grid-column: 2;
      margin-bottom: 0.5rem;
    }

    .quality-test-exception-list {
      grid-column: 2;
      list-style-type: disc;

      .quality-test-exception {
        padding: 0.2rem 0;
        font-size: 105%;
        font-weight: 400;
      }

      .quality-test-exception-error {
        color: variables.$red4;
      }

      .quality-test-exception-warning {
        color: variables.$yellow3;
      }

      .quality-test-exception-info {
        color: #606060;
      }
    }
  }
}

@media screen and (max-width: variables.$narrow-screen) {
  .quality-report-header .donut {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
