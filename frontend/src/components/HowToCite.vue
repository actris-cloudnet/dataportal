<template>
  <div>
    <div class="title-container">
      <div :class="['title', titleClass]">Citation</div>
      <ul class="export" v-if="citation.status == 'ready'">
        <li><a :href="citation.bibtexUrl">BibTeX</a></li>
        <li><a :href="citation.risUrl">RIS</a></li>
      </ul>
    </div>
    <template v-if="citation.status == 'ready'">
      <div class="infobox infocolor">
        <div class="citationtext" v-html="citation.citation"></div>
      </div>
      <p>
        Please include the following information in your publication. You may edit the text to suit publication
        standards.
      </p>
      <div class="infobox infocolor">
        <h4>Data availability</h4>
        <div class="citationtext" v-html="citation.dataAvailability"></div>
        <h4>Acknowledgements</h4>
        <div class="citationtext" v-html="citation.acknowledgements"></div>
      </div>
    </template>
    <BaseSpinner v-else-if="citation.status == 'loading'" />
    <div v-else-if="citation.status == 'error'" class="error">Failed to load citation.</div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, watchEffect } from "vue";
import BaseSpinner from "@/components/BaseSpinner.vue";
import { backendUrl } from "@/lib";

export interface Props {
  uuid: string;
  titleClass?: string;
}

const props = defineProps<Props>();

type CitationState =
  | { status: "loading" }
  | {
      status: "ready";
      citation: string;
      acknowledgements: string;
      dataAvailability: string;
      bibtexUrl: string;
      risUrl: string;
    }
  | { status: "error" };

const citation = ref<CitationState>({ status: "loading" });

async function fetchReferenceStrings(uuid: string) {
  const baseUrl = `${backendUrl}reference/${uuid}/`;
  try {
    const responses = await Promise.all([
      axios.get(`${baseUrl}citation?format=html`),
      axios.get(`${baseUrl}acknowledgements?format=html`),
      axios.get(`${baseUrl}data-availability?format=html`),
    ]);
    citation.value = {
      status: "ready",
      citation: responses[0].data,
      acknowledgements: responses[1].data,
      dataAvailability: responses[2].data,
      bibtexUrl: `${baseUrl}/citation?format=bibtex`,
      risUrl: `${baseUrl}/citation?format=ris`,
    };
  } catch (error) {
    console.error("Failed to load citation:", error);
    citation.value = { status: "error" };
  }
}

watchEffect(() => {
  citation.value = { status: "loading" };
  fetchReferenceStrings(props.uuid).catch(() => {
    /* skip */
  });
});
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

.error {
  color: red;
}

.title-container {
  display: flex;
  align-items: center;
}

.title {
  flex-grow: 1;
}

.export {
  display: flex;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 75%;
}

p {
  margin: 1rem 0;
}

.infobox {
  padding: 1rem;
  border-radius: 0.3rem;
}

.infocolor {
  background: variables.$blue-dust;
  font-size: 0.9em;

  h4 {
    font-size: 1.1em;
    margin-top: 1rem;
    margin-bottom: 0.25rem;

    &:first-child {
      margin-top: 0;
    }
  }
}
</style>
