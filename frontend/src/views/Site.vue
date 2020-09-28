<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"
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
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {Site} from '../../../backend/src/entity/Site'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'

@Component
export default class SiteView extends Vue {
  @Prop() siteid!: string
  apiUrl = process.env.VUE_APP_BACKENDURL
  response: Site | null = null
  latestFile: SearchFileResponse | null = null
  error = false


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
  }
}
</script>
