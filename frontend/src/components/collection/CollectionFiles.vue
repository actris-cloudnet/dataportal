<script lang="ts" setup>
import DataSearchResult from "@/components/DataSearchResult.vue";
import type { Collection } from "@shared/entity/Collection";

export interface Props {
  collection: Collection;
}

defineProps<Props>();
</script>

<template>
  <DataSearchResult :collection="collection.uuid" simplifiedView />
</template>
