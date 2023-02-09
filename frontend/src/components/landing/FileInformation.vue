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
          <Copyable title="Copy the full hash" :value="response.checksum">
            {{ response.checksum.slice(0, 7) }}
          </Copyable>
        </td>
      </tr>
      <tr>
        <th>Last modified</th>
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

<script lang="ts" setup>
import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";
import { humanReadableSize, humanReadableTimestamp } from "../../lib";
import Copyable from "./Copyable.vue";

interface Props {
  response: ModelFile | RegularFile | null;
}

defineProps<Props>();
</script>
