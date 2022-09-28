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
        <th>Hash</th>
        <td>
          <div class="landing-hash" @dblclick="toggleHash">
            <span v-if="smallHash" class="landing-hash-small"> {{ response.checksum.slice(0, 7) }} (SHA-256) </span>
            <span v-else class="landing-hash-large"> {{ response.checksum }} (SHA-256) </span>
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
  smallHash = true;

  toggleHash() {
    this.smallHash = !this.smallHash;
  }
}
</script>
