<script lang="ts" setup>
import type { CollectionFileResponse } from "@shared/entity/CollectionFileResponse";
import DataSearchResult from "@/components/DataSearchResult.vue";

export interface Props {
  files: CollectionFileResponse[];
}

defineProps<Props>();
</script>

<template>
  <DataSearchResult :apiResponse="files" simplifiedView />
</template>
