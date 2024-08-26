<template>
  <div v-if="file" class="summary-section" id="file-information">
    <div class="summary-section-header">File</div>
    <dl class="summary-section-table">
      <dt>PID</dt>
      <dd v-if="file.pid.length > 2">
        <a :href="file.pid">{{ file.pid }}</a>
      </dd>
      <dd v-else class="notAvailable"></dd>
      <dt>Filename</dt>
      <dd>{{ file.filename }}</dd>
      <dt>Format</dt>
      <dd>{{ file.format }}</dd>
      <dt>Size</dt>
      <dd>{{ humanReadableSize(file.size) }}</dd>
      <dt>Hash (SHA-256)</dt>
      <dd>
        <Copyable title="Copy the full hash" :value="file.checksum">
          {{ file.checksum.slice(0, 7) }}
        </Copyable>
      </dd>
      <dt>Last modified</dt>
      <dd>{{ humanReadableTimestamp(file.updatedAt) }}</dd>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import type { FileResponse } from "@/views/FileView.vue";
import { humanReadableSize, humanReadableTimestamp } from "@/lib";
import Copyable from "./CopyableText.vue";

export interface Props {
  file: FileResponse;
}

defineProps<Props>();
</script>
