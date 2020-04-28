<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"

main#landing

  #preview
    max-width: 400px
    img
      width: 100%

  >header
    margin-bottom: 3em
    display: flex
    justify-content: space-between
    align-items: center
    flex-wrap: wrap
    h2
      color: $section-title
      margin: 0px
    span
      display: block
      color: grey
      font-style: italic
    span::first-letter
      text-transform: capitalize

  div.actions
    margin-top: 5px
    margin-bottom: 5px

  .volatilenote
    border: 1px #cad7ff solid
    border-radius: 2px
    background: #eef2ff
    width: 100%
    padding-top: 0.5em
    padding-bottom: 0.5em
    padding-left: 1em
    padding-right: 1em
    margin-bottom: 2em

  main
    margin: -1em
    display: flex
    justify-content: center
    flex-wrap: wrap

    > section
      flex-grow: 0.5
      border: 1px solid grey
      border-radius: 3px
      box-shadow: 3px 3px 2px rgba(0,0,0,0.1)
      margin: 1em
      min-width: 20em
      word-wrap: anywhere

      > *
        padding: 10px

      > header
        background: $blue-dust
        border-bottom: 1px solid grey
        font-size: 1.1em

      dl
        margin-top: 5px
        margin-bottom: 5px
        margin-left: 10px
        display: grid
        grid-template-columns: auto 4fr
        column-gap: 0.5em
        row-gap: 0.5em

      dt
        text-align: left
        font-weight: 600
        max-width: 11em
      dt::after
        content: ": "

      dd
        text-align: left
        margin: 0

    section#history > section
      white-space: pre-wrap
      font-family: monospace

.capitalize
  text-transform: capitalize

.na
  color: grey

img.product
  height: auto
  width: 1em
  margin-right: 0.3em
</style>


<template>
  <main id="landing" v-if="!error && response">
    <header>
      <div class="summary">
          <h2>Cloudnet data object</h2>
          <span>
            {{ response.product.humanReadableName }} data from
            {{ response.site.humanReadableName }} on
            {{ humanReadableDate(response.measurementDate) }}.
          </span>
      </div>
      <div class="actions">
        <a class="download" :href="response.url">
          Download file
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </a>
      </div>
    </header>
    <div v-if="response.volatile" class="volatilenote">
      This is a volatile file. The data in this file may be incomplete and update in real time.
    </div>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>Identifier</dt>
            <dd>{{ response.uuid }}</dd>
            <dt>Filename</dt>
            <dd>{{ response.filename }}</dd>
            <dt>Format</dt>
            <dd>{{ response.format }}</dd>
            <dt>Size</dt>
            <dd>{{ response.size }} bytes ({{ humanReadableSize(response.size) }})</dd>
            <dt>Hash (SHA-256)</dt>
            <dd>{{ response.checksum }}</dd>
          </dl>
        </section>
      </section>
      <section id="data">
        <header>Product information</header>
        <section class="details">
          <dl>
            <dt>Product</dt>
            <dd class="capitalize">
              <img :src="getIconUrl(response.product.id)" class="product">
              {{ response.product.humanReadableName }}
            </dd>
            <dt>Level</dt>
            <dd>{{ response.product.level }}</dd>
            <dt>Quality</dt>
            <dd>Near Real Time (NRT)</dd>
            <dt v-if="response.cloudnetpyVersion">CloudnetPy version</dt>
            <dd v-if="response.cloudnetpyVersion">{{ response.cloudnetpyVersion }}</dd>
            <dt>Data from</dt>
            <dd>{{ response.measurementDate }}</dd>
          </dl>
        </section>
      </section>
      <section id="measurement">
        <header>Site information</header>
        <section class="details">
          <dl>
            <dt>Location</dt>
            <dd>{{ response.site.humanReadableName }}, {{ response.site.country }}</dd>
            <dt>Coordinates</dt>
            <dd>{{ response.site.latitude }}&deg; N, {{ response.site.longitude }}&deg; E</dd>
            <dt>Site altitude</dt>
            <dd>{{ response.site.altitude }} m</dd>
          </dl>
        </section>
      </section>
      <section id="preview">
        <header>Preview</header>
        <section class="details" :class="{ 'missing' : missing == true}">
          <img v-if="!missing" :src="getQuicklook()" />
        </section>
      </section>
      <section id="history">
        <header>History</header>
        <section class="details" v-if="response.history">{{ response.history.trim() }}
        </section>
        <section class="details na" v-else>N/A
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import axios from 'axios'
import { getIconUrl, humanReadableSize, humanReadableDate } from '../lib'
import { DevMode } from '../lib/DevMode'

@Component
export default class File extends Vue {
  @Prop() uuid!: string
  response = null
  error = false
  apiUrl = process.env.VUE_APP_BACKENDURL

  humanReadableSize = humanReadableSize
  humanReadableDate = humanReadableDate
  getIconUrl = getIconUrl

  devMode = new DevMode()
  missing = false

  getQuicklook() {
    try {
      this.missing = false
      return require(`../../../backend/quicklooks/${this.response.filename.replace('.nc', '.png')}`)
    } catch (e) {
      this.missing = true
    }
  }

  created() {
    const payload = { params: { developer: this.devMode.activated || undefined}}
    axios
      .get(`${this.apiUrl}file/${this.uuid}`, payload)
      .then(response => {
        this.response = response.data
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
  }
}
</script>
