<style scoped lang="sass">
@import "../../sass/landing-beta.sass"

.citation-note
  padding-left: $basespacing/2
  padding-right: $basespacing/2

.volatile-disclaimer-banner
  background-color: rgba($BLUE-3-rgb,0.4)
  border-radius: $baseradius
  font-weight: 400
  font-size: 90%
  padding: 0.5*$basespacing $basespacing

.summary-section-header-container
  display: flex
  flex-direction: row
  justify-content: space-between

.summary-section-header-container
  display: flex
  flex-direction: row
  justify-content: space-between

.acknowledgements-export
  font-size: 80%
  font-weight: 500
  align-self: center
  color: red

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
</style>

<template>
  <div class="summary-section" id="citation">
    <div v-if="isVolatile" class="volatile-disclaimer-banner">
      Be aware that this data is volatile and may be updated in the future.
    </div>
    <section class="citation-section" id="citation">
      <div class="summary-section-header-container">
        <div class="summary-section-header">Citation</div>
        <div class="citation-export">
          <a :href="bibtexUrl">BibTeX</a>
          <a :href="risUrl">RIS</a>
        </div>
      </div>
      <div v-if="!longCitation" class="example citation-section-content small" v-html="visibleCitationString"></div>
      <div
        v-else
        class="example citation-section-content long"
        :class="{ full: !longCitationReduced, reduced: longCitationReduced }"
        @dblclick="toggleCitation"
        v-html="visibleCitationString"
      >
        <span v-if="longCitationReduced"> &#183; &#183; &#183;</span>
      </div>
    </section>
    <section class="citation-section">
      <p class="citation-note">
        Please include the following information in your publication. You may edit the text to suit publication
        standards.
      </p>
      <div class="example">
        <div class="example-header">Data availability</div>
        <p v-html="dataAvailabilityString"></p>
        <div class="example-header">Acknowledgements</div>
        <div v-html="acknowledgementsString"></div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";
import axios from "axios";

import { ModelFile, RegularFile } from "../../../../backend/src/entity/File";

@Component
export default class Citation extends Vue {
  @Prop() uuid!: string;
  @Prop() file!: ModelFile | RegularFile | null;
  citationString = "";
  acknowledgementsString = "";
  dataAvailabilityString = "";

  longCitationReduced = true;

  async created() {
    await this.fetchReferenceStrings();
  }

  get longCitation() {
    return this.citationString.length > 500;
  }

  get visibleCitationString() {
    if (this.longCitation && this.longCitationReduced) {
      return this.citationString.replace(/(<([^>]+)>)/gi, "").slice(0, 500);
    } else {
      return this.citationString;
    }
  }

  toggleCitation() {
    this.longCitationReduced = !this.longCitationReduced;
  }

  get isVolatile() {
    return this.file ? this.file.volatile : false;
  }

  get referenceUrl() {
    return `${process.env.VUE_APP_BACKENDURL}reference/${this.uuid}/`;
  }

  get bibtexUrl() {
    return `${this.referenceUrl}?citation=true&format=bibtex`;
  }
  get risUrl() {
    return `${this.referenceUrl}?citation=true&format=ris`;
  }

  async fetchReferenceStrings() {
    await axios
      .get(`${this.referenceUrl}?citation=true&format=html`)
      .then((response) => {
        this.citationString = response.data;
      })
      .catch((error) => console.error(error));
    await axios
      .get(`${this.referenceUrl}?acknowledgements=true&format=html`)
      .then((response) => {
        this.acknowledgementsString = response.data;
      })
      .catch((error) => console.error(error));
    await axios
      .get(`${this.referenceUrl}?dataAvailability=true&format=html`)
      .then((response) => {
        this.dataAvailabilityString = response.data;
      })
      .catch((error) => console.error(error));
  }
}
</script>
