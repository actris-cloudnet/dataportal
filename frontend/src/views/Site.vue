<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

.forcewrap
  flex-basis: 100%
  height: 0

</style>


<template>
  <main id="sitelanding" v-if="!error && response">
    <header>
      <h2>{{ response.humanReadableName }}</h2>
    </header>
    <main class="info">
      <section id="summary">
        <header>Summary</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd>{{ response.humanReadableName }}, {{ response.country }}</dd>
            <dt>Coordinates</dt>
            <dd>{{ response.latitude }}&deg; N, {{ response.longitude }}&deg; E</dd>
            <dt>Site altitude</dt>
            <dd>{{ response.altitude }} m</dd>
            <dt>Last measurement</dt>
            <dd v-if="latestFile">{{ latestFile.measurementDate }}</dd>
            <dd class="notAvailable" v-else></dd>
          </dl>
        </section>
      </section>
      <section id="instruments">
        <header>Instruments</header>
        <section class="details">
          <div v-if="instruments && instruments.length" class="detailslist">
          <span class="notice">
            The site has submitted data from the following instruments in the last {{ instrumentsFromLastDays }} days:<br>
          </span>
           <div v-for="instrument in instruments" :key="instrument.id" class="detailslistItem">
               <img :src="getIconUrl(instrument.instrument.type)" class="product">
               {{ instrument.instrument.humanReadableName }}
           </div>
          </div>
          <div class="detailslistNotAvailable" v-else>Instrument information not available.</div>
        </section>
      </section>
      <div class="forcewrap"></div>
      <section id="sitemap">
        <header>Map</header>
        <section class="details">
          <Map
            :sites="[response]"
            :center="[response.latitude, response.longitude]"
            :zoom="5"
          ></Map>
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {Site} from '../../../backend/src/entity/Site'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import Map from '../components/Map.vue'
import {ReducedMetadataResponse} from '../../../backend/src/entity/ReducedMetadataResponse'
import {getIconUrl} from '../lib'

@Component({
  components: {Map}
})
export default class SiteView extends Vue {
  @Prop() siteid!: string
  apiUrl = process.env.VUE_APP_BACKENDURL
  response: Site | null = null
  latestFile: SearchFileResponse | null = null
  error = false
  instruments: ReducedMetadataResponse[] | null = null
  instrumentsFromLastDays = 30
  getIconUrl = getIconUrl

  created() {
    axios
      .get(`${this.apiUrl}sites/${this.siteid}`)
      .then(({data}) => (this.response = data))
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
    axios
      .get(`${this.apiUrl}search/`, {params: { location: this.siteid, limit: 1}})
      .then(({data}) => (this.latestFile = data[0]))
      .catch()
    const date30daysago = new Date()
    date30daysago.setDate(date30daysago.getDate() - this.instrumentsFromLastDays)
    axios
      .get(`${this.apiUrl}uploaded-metadata/`, {params: { site: this.siteid, dateFrom: date30daysago}})
      .then(({data}) => (this.instruments = data))
      .catch()
  }
}
</script>
