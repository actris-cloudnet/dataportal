<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { CollectionResponse } from "@shared/entity/CollectionResponse";
import HowToCite from "@/components/HowToCite.vue";
import License from "@/components/LicenseInfo.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseAlert from "@/components/BaseAlert.vue";

export interface Props {
  collection: CollectionResponse;
}

const props = defineProps<Props>();

const apiUrl = import.meta.env.VITE_BACKEND_URL;
const citationBusy = ref(false);
const pidServiceError = ref(false);

const downloadUrl = computed(() => {
  return `${apiUrl}download/collection/${props.collection.uuid}`;
});

async function generatePid(): Promise<void> {
  if (props.collection.pid) return;
  try {
    const payload = {
      type: "collection",
      uuid: props.collection.uuid,
    };
    await axios.post(`${apiUrl}generate-pid`, payload);
  } catch (error) {
    pidServiceError.value = true;
    console.error(error);
  }
}

onMounted(() => {
  citationBusy.value = true;
  generatePid().finally(() => {
    citationBusy.value = false;
  });
});
</script>

<template>
  <section>
    <BaseAlert type="error" v-if="pidServiceError">
      Failed to create DOI for this collection. Please try again later.
    </BaseAlert>
    <HowToCite :uuid="citationBusy ? undefined : collection.uuid" />
    <h3>License</h3>
    <license></license>
    <h3>Download</h3>
    By clicking the download button you confirm that you have taken notice of the above data licensing information.<br />
    <BaseButton type="primary" :href="downloadUrl" id="downloadCollection">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
      Download
    </BaseButton>
  </section>
</template>
