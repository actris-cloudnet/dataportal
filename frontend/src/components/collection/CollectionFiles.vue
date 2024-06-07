<script lang="ts" setup>
import DataSearchResult from "@/components/DataSearchResult.vue";
import type { CollectionResponse } from "@shared/entity/CollectionResponse";

export interface Props {
  collection: CollectionResponse;
}

defineProps<Props>();
</script>

<template>
  <DataSearchResult :collection="collection.uuid" simplifiedView />
</template>
