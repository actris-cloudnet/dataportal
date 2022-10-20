<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
ul.ack-list
  list-style: circle
  padding: 0 $basespacing
li.ack-entry:not(:first-child)
  margin-top: 0.3*$basespacing

li.ack-entry
  padding-inline-start: 0.5*$basespacing
li.ack-entry::marker
li.ack-entry::before
.ack-list
  border-radius: $baseradius
  //border: 1px solid rgba(0,0,0,0.1)
.ack-entry:not(:first-child)
  //border-top: 1px solid rgba(0,0,0,0.1)
.ack-entry
  font-weight: 400
  font-size: 100%
  //padding: 0.4*$basespacing 0.4*$basespacing
  //transition: background-color 200ms ease-in-out
.ack-entry:hover
  //background-color: rgba(0,0,0,0.03)
.data-availibility-statement-note

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
      <div v-if="!longCitation" class="citation-section-content small" v-html="visibleCitationString"></div>
      <div
        v-else
        class="citation-section-content long"
        :class="{ full: !longCitationReduced, reduced: longCitationReduced }"
        @dblclick="toggleCitation"
        v-html="visibleCitationString"
      >
        <span v-if="longCitationReduced"> &#183; &#183; &#183;</span>
      </div>
    </section>
    <div></div>
    <section class="citation-section">
      <div class="summary-section-header-container">
        <div class="summary-section-header">Acknowledgements</div>
        <div class="acknowledgements-export">
          <a :href="plainAckUrl">Example</a>
        </div>
      </div>
      <div class="citation-section-note">Acknowledge the following stakeholders in your publication:</div>
      <div v-if="ackList.length > 0" class="citation-section-content">
        <ul class="ack-list">
          <li class="ack-entry" v-for="(ack, i) in ackList" :key="'ack' + i">
            {{ ack }}
          </li>
        </ul>
      </div>
      <div v-else class="citation-section-content">
        <span class="notAvailable"></span>
      </div>
    </section>
    <section class="citation-section">
      <div class="summary-section-header">Data availability</div>
      <div class="citation-section-note">Example statement:</div>
      <div class="citation-section-content" v-html="dataAvailabilityString"></div>
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
  ackList = [];
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
  get jsonUrl() {
    return `${this.referenceUrl}?citation=true&format=json`;
  }
  get plainAckUrl() {
    return `${this.referenceUrl}?acknowledgements=true&format=plain`;
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
      .get(`${this.referenceUrl}?acknowledgements=true&format=json`)
      .then((response) => {
        this.ackList = response.data;
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
