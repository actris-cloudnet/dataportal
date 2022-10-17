<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <div v-if="response" class="summary-section" id="file-information">
    <div class="summary-section-header">File</div>
    <table class="summary-section-table">
      <tr>
        <th>PID</th>
        <td v-if="response.pid.length > 2">
          <a :href="response.pid">{{ response.pid }}</a>
        </td>
        <td v-else class="notAvailable"></td>
      </tr>
      <tr>
        <th>Filename</th>
        <td>{{ response.filename }}</td>
      </tr>
      <tr>
        <th>Format</th>
        <td>{{ response.format }}</td>
      </tr>
      <tr>
        <th>Size</th>
        <td>{{ humanReadableSize(response.size) }}</td>
      </tr>
      <tr>
        <th>Hash (SHA-256)</th>
        <td>
          <div class="landing-hash">
            <span class="landing-hash" title="Copy the full hash">
              {{ response.checksum.slice(0, 7) }}
              <button class="copy-button" @click="copyHash">
                <svg width="16" height="16" viewBox="0 0 115.77 122.88">
                  <path
                    d="M89.62,13.96v7.73h12.19h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02v0.02 v73.27v0.01h-0.02c-0.01,3.84-1.57,7.33-4.1,9.86c-2.51,2.5-5.98,4.06-9.82,4.07v0.02h-0.02h-61.7H40.1v-0.02 c-3.84-0.01-7.34-1.57-9.86-4.1c-2.5-2.51-4.06-5.98-4.07-9.82h-0.02v-0.02V92.51H13.96h-0.01v-0.02c-3.84-0.01-7.34-1.57-9.86-4.1 c-2.5-2.51-4.06-5.98-4.07-9.82H0v-0.02V13.96v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07V0h0.02h61.7 h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02V13.96L89.62,13.96z M79.04,21.69v-7.73v-0.02h0.02 c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v64.59v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h12.19V35.65 v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07v-0.02h0.02H79.04L79.04,21.69z M105.18,108.92V35.65v-0.02 h0.02c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v73.27v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h61.7h0.02 v0.02c0.91,0,1.75-0.39,2.37-1.01c0.61-0.61,1-1.46,1-2.37h-0.02V108.92L105.18,108.92z"
                  />
                </svg>
              </button>
              <span class="copy-message" v-if="copyMessage">({{ copyMessage }})</span>
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <th>Updated</th>
        <td>{{ humanReadableTimestamp(response.updatedAt) }}</td>
      </tr>
      <tr>
        <th>Licence</th>
        <td>
          <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import { humanReadableSize, humanReadableTimestamp } from "../../lib";

@Component
export default class FileInformation extends Vue {
  @Prop() response!: ModelFile | RegularFile | null;
  humanReadableSize = humanReadableSize;
  humanReadableTimestamp = humanReadableTimestamp;
  copyMessage = "";

  copyHash() {
    if (!this.response) return;
    navigator.clipboard.writeText(this.response.checksum).then(
      () => {
        this.copyMessage = "copied";
        setTimeout(() => {
          this.copyMessage = "";
        }, 2000);
      },
      () => {
        this.copyMessage = "failed to copy";
      }
    );
  }
}
</script>
