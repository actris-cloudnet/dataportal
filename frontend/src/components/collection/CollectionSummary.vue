<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import type { Collection } from "@shared/entity/Collection";
import HowToCite from "@/components/HowToCite.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseAlert from "@/components/BaseAlert.vue";
import { backendUrl } from "@/lib";
import BaseSpinner from "../BaseSpinner.vue";
import ccIcon from "@/assets/icons/cc.svg";
import byIcon from "@/assets/icons/by.svg";

export interface Props {
  collection: Collection;
}

const props = defineProps<Props>();

const citationBusy = ref(false);
const pidGenerated = ref(false);
const pidServiceError = ref(false);

const downloadUrl = computed(() => {
  return `${backendUrl}download/collection/${props.collection.uuid}`;
});

async function generatePid(): Promise<void> {
  citationBusy.value = true;
  try {
    const payload = {
      type: "collection",
      uuid: props.collection.uuid,
    };
    await axios.post(`${backendUrl}generate-pid`, payload);
    pidGenerated.value = true;
  } catch (error) {
    pidServiceError.value = true;
    console.error(error);
  } finally {
    citationBusy.value = false;
  }
}

onMounted(() => {
  pidGenerated.value = !!props.collection.pid;
});
</script>

<template>
  <section>
    <BaseAlert type="error" v-if="pidServiceError">
      Failed to create DOI for this collection. Please try again later.
    </BaseAlert>
    <BaseSpinner v-if="citationBusy" />
    <HowToCite v-if="pidGenerated" :uuid="collection.uuid" titleClass="title" />
    <h3 class="title">Download</h3>
    <p xmlns:cc="http://creativecommons.org/ns#">
      ACTRIS Cloudnet data is licensed under
      <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">
        CC BY 4.0
        <img :src="ccIcon" /><img :src="byIcon" />
      </a>
    </p>
    <div class="buttons">
      <BaseButton type="primary" :href="downloadUrl" id="downloadCollection">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
        Download
      </BaseButton>
      <BaseButton type="secondary" @click="generatePid" :disabled="citationBusy" v-if="!pidGenerated">
        Create DOI
      </BaseButton>
    </div>
  </section>
</template>

<style scoped lang="scss">
section {
  padding-bottom: 1rem;
}

:deep(.title) {
  margin-bottom: 1rem;
  font-size: 1.2rem;

  &:not(:first-child) {
    margin-top: 2rem;
  }
}

.buttons {
  display: flex;
  gap: 0.5rem;
}

p {
  margin-bottom: 1rem;
}

img {
  height: 22px;
  margin-left: 3px;
  vertical-align: text-bottom;
}
</style>
