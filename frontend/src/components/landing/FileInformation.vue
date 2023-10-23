<template>
  <div v-if="response" class="summary-section" id="file-information">
    <div class="summary-section-header">File</div>
    <dl class="summary-section-table">
      <dt>PID</dt>
      <dd v-if="response.pid.length > 2">
        <a :href="response.pid">{{ response.pid }}</a>
      </dd>
      <dd v-else class="notAvailable"></dd>
      <dt>Filename</dt>
      <dd>{{ response.filename }}</dd>
      <dt>Format</dt>
      <dd>{{ response.format }}</dd>
      <dt>Size</dt>
      <dd>{{ humanReadableSize(response.size) }}</dd>
      <dt>Hash (SHA-256)</dt>
      <dd>
        <Copyable title="Copy the full hash" :value="response.checksum">
          {{ response.checksum.slice(0, 7) }}
        </Copyable>
      </dd>
      <dt>Last modified</dt>
      <dd>{{ humanReadableTimestamp(response.updatedAt) }}</dd>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import type { FileResponse } from "@/views/FileView.vue";
import { humanReadableSize, humanReadableTimestamp } from "@/lib";
import Copyable from "./CopyableText.vue";

export interface Props {
  response: FileResponse;
}

defineProps<Props>();
</script>
