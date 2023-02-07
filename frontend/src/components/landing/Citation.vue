<style scoped lang="sass">
@import "../../sass/landing-beta.sass"

.citation-note
  padding-left: $basespacing/2
  padding-right: $basespacing/2

.disclaimer-banner
  display: flex
  align-items: center
  border-radius: $baseradius
  font-weight: 400
  font-size: 90%
  padding: 0.5*$basespacing $basespacing
  margin-bottom: 0.7em
  .banner-icon
    height: 1rem
    padding-right: 0.5*$basespacing
    opacity: 0.4

.volatile-banner
  background-color: rgba($BLUE-3-rgb, 0.4)

.legacy-banner
  background-color: rgba($GRAY-3-hex, 0.4)

.summary-section-header-container
  display: flex
  flex-direction: row
  justify-content: space-between

.summary-section-header-container
  display: flex
  flex-direction: row
  justify-content: space-between

.citation-export
  align-self: center
  font-size: 80%
  font-weight: 500
  display: flex
  flex-grow: 1
  justify-content: flex-end
  margin-bottom: 0.4*$basespacing
  a:not(:first-child)
    margin-left: $basespacing

.example
  background: rgba(64, 64, 128, .05)
  padding: .75*$basespacing $basespacing
  border-radius: $baseradius
  font-size: 90%

.example-header
  font-weight: 400
  font-size: 110%
  margin-bottom: .5*$basespacing

.loading
  color: gray

.error
  color: red
</style>

<template>
  <div class="summary-section" id="citation">
    <div v-if="file.volatile" class="disclaimer-banner" :class="'volatile-banner'">
      <img class="banner-icon" alt="warning icon" :src="require('../../assets/icons/test-warning-mono.svg')" />
      <span v-if="file.volatile">This data object is volatile and may be updated in the future.</span>
    </div>
    <div v-if="file.legacy" class="disclaimer-banner" :class="'legacy-banner'">
      <img class="banner-icon" alt="warning icon" :src="require('../../assets/icons/test-warning-mono.svg')" />
      <span v-if="file.legacy">This data object was produced using nonstandard processing.</span>
    </div>

    <section class="citation-section" id="citation">
      <div class="summary-section-header-container">
        <div class="summary-section-header">Citation</div>
        <div class="citation-export" v-if="citation.status == 'ready'">
          <a :href="citation.bibtexUrl">BibTeX</a>
          <a :href="citation.risUrl">RIS</a>
        </div>
      </div>
      <div v-if="citation.status == 'ready'" class="example citation-section-content" v-html="citation.citation"></div>
      <div v-else-if="citation.status == 'loading'" class="loading">Loading...</div>
      <div v-else-if="citation.status == 'error'" class="error">Failed to load citation.</div>
    </section>
    <section class="citation-section" v-if="citation.status == 'ready'">
      <p class="citation-note">
        Please include the following information in your publication. You may edit the text to suit publication
        standards.
      </p>
      <div class="example">
        <div class="example-header">Data availability</div>
        <p v-html="citation.dataAvailability"></p>
        <div class="example-header">Acknowledgements</div>
        <div v-html="citation.acknowledgements" v-if="citation.status == 'ready'"></div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import axios from "axios";

import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";

interface Props {
  uuid: string;
  file: ModelFile | RegularFile;
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

watch(
  () => props.uuid,
  async () => {
    citation.value = { status: "loading" };
    await fetchReferenceStrings();
  },
  { immediate: true }
);

async function fetchReferenceStrings() {
  const baseUrl = `${process.env.VUE_APP_BACKENDURL}reference/${props.uuid}/`;
  try {
    const responses = await Promise.all([
      axios.get(`${baseUrl}?citation=true&format=html`),
      axios.get(`${baseUrl}?acknowledgements=true&format=html`),
      axios.get(`${baseUrl}?dataAvailability=true&format=html`),
    ]);
    citation.value = {
      status: "ready",
      citation: responses[0].data,
      acknowledgements: responses[1].data,
      dataAvailability: responses[2].data,
      bibtexUrl: `${baseUrl}?citation=true&format=bibtex`,
      risUrl: `${baseUrl}?citation=true&format=ris`,
    };
  } catch (error) {
    console.error("Failed to load citation:", error);
    citation.value = { status: "error" };
  }
}
</script>
