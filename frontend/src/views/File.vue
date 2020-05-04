<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
$border-color: #c8c8c8

main#landing

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
    border-color: #cad7ff
    background: #eef2ff

  main
    margin: -1em
    display: flex
    justify-content: center
    flex-wrap: wrap

    > section
      flex-grow: 0.5
      border: 1px solid $border-color
      border-radius: 3px
      box-shadow: 2px 2px 2px rgba(0,0,0,0.1)
      margin: 1em
      min-width: 20em
      word-wrap: anywhere

      > *
        padding: 10px

      > header
        background: $landing-header
        border-bottom: 1px solid $border-color
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

    .monospace
      white-space: pre-wrap
      font-family: monospace
      width: 100%
      display: block

    .notice
      font-size: 0.9em

  #preview
    max-width: 45em
    img
      width: 100%
      height: auto

  .linkNotImplemented
    text-decoration: underline
    cursor: default
    color: #a0a9aa

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
    <div v-if="response.volatile" class="note volatilenote">
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
        <section class="details">
          <img id="previewImg" v-show="imgExists" v-bind:src="`${quicklookUrl}${imgName}`" @load="imgExists = true">
          <span v-if="imgExists" title="This feature is not yet implemented." class="linkNotImplemented">
            See all plots &rarr;
          </span>
          <span v-else>Preview not available</span>
        </section>
      </section>
      <section id="history">
        <header>History</header>
        <section class="details" v-if="response.history">
          <span class="monospace">{{ response.history.trim() }}</span>
          <span class="notice">This is a non-standardized history provided by the file creator/processor.</span>
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
import { File } from '../../../backend/src/entity/File'

@Component
export default class FileView extends Vue {
  @Prop() uuid!: string
  response: File | null = null
  error = false
  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL
  apiUrl = process.env.VUE_APP_BACKENDURL

  humanReadableSize = humanReadableSize
  humanReadableDate = humanReadableDate
  getIconUrl = getIconUrl
  devMode = new DevMode()

  get imgName() {
    if (!this.response) return ''
    return this.response.filename.replace('.nc', '.png')
  }

  imgExists = false

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
