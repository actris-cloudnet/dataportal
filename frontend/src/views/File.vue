<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/visualizations.sass"
@import "../sass/landing.sass"

main#filelanding

  >header
    display: flex
    justify-content: space-between
    align-items: center
    flex-wrap: wrap
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

  .versionnote
    border-color: #fff2ca
    background: #fffdee

  section#preview.wide
    flex-basis: 100%

  .history
    flex-grow: 1
    flex-direction: column
    display: flex
    justify-content: space-between
    align-items: flex-start

  .monospace
    white-space: pre-wrap
    font-family: monospace
    width: 100%
    display: block

  .notice
    font-size: 0.9em

  #preview
    flex-basis: 600px
    img
      width: 100%
      height: auto

  a.viewAllPlots
    cursor: pointer
  a.viewAllPlots:hover
    color: #0056b3
    text-decoration: underline
.capitalize
  text-transform: capitalize

.na
  color: grey

.download:focus
  outline: thin dotted black

img.product
  height: auto
  width: 1em
  margin-right: 0.3em

.sourceFileList
  margin-top: 5px
  margin-bottom: 1em
  margin-left: 10px

.sourceFileNotAvailable
  margin-bottom: 1em
</style>


<template>
  <main id="filelanding" v-if="!error && response">
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
    <div v-if="newestVersion" class="note versionnote">
      A <router-link id="newestVersion" :to="`/file/${newestVersion}`">newer version</router-link> of this file is available.
    </div>
    <main class="info">
      <section id="file">
        <header>File information</header>
        <section class="details">
          <dl>
            <dt>PID</dt>
            <dd v-if="response.pid.length > 2"> <a :href=response.pid> {{ response.pid }} </a></dd>
            <dd v-else class="notAvailable"></dd>
            <dt>Filename</dt>
            <dd>{{ response.filename }}</dd>
            <dt>Format</dt>
            <dd>{{ response.format }}</dd>
            <dt>Size</dt>
            <dd>{{ response.size }} bytes ({{ humanReadableSize(response.size) }})</dd>
            <dt>Hash (SHA-256)</dt>
            <dd>{{ response.checksum }}</dd>
            <dt>Last modified</dt>
            <dd>{{ response.releasedAt }}</dd>
            <dt>Versions</dt>
            <dd>
              <router-link v-if="previousVersion" id="previousVersion" :to="`/file/${previousVersion}`">
                previous
              </router-link>
              <span v-if="previousVersion && nextVersion">-</span>
              <router-link v-if="nextVersion" id="nextVersion" :to="`/file/${nextVersion}`"> next</router-link>
              <span v-if="!previousVersion && !nextVersion" class="notAvailable"></span>
            </dd>
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
      <section id="history">
        <header>History</header>
        <section class="details history">
          <div v-if="response.sourceFileIds && response.sourceFileIds.length > 0">
            <span class="notice">This file was generated using the following files:<br></span>
            <div v-for="sourceFile in sourceFiles" :key="sourceFile.uuid" class="sourceFileList">
              <router-link :to="`/file/${sourceFile.uuid}`">
                <img :src="getIconUrl(sourceFile.product.id)" class="product">
                {{ sourceFile.product.humanReadableName }}
              </router-link><br>
            </div>
          </div>
          <div class="sourceFileNotAvailable" v-else>Source file information not available.</div>
          <div v-if="showHistory">
            <span class="notice">Details:</span>
            <span class="monospace">{{ response.history.trim() }}</span>
            <span class="notice">This is a non-standardized history provided by the file creator/processor.
              <a href="" @click.prevent="showHistory = false" id="hideHistory">Hide details</a>.
            </span>
          </div>
          <a href="" @click.prevent="showHistory = true" id="showHistory" class="notice" v-else>Show details</a>
        </section>
      </section>
      <section id="preview" v-bind:class="{ wide: allVisualizations }">
        <header>Preview</header>
        <section class="details">
          <div v-if="visualizations.length" v-bind:class="{sourceFile: allVisualizations}">
            <div v-for="viz in getVisualizations(visualizations)"
                 :key="viz.productVariable.id" class="variable">
              <h4>{{ viz.productVariable.humanReadableName }}</h4>
              <img v-bind:src="`${quicklookUrl}${viz.filename}`" class="visualization">
            </div>
          </div>
          <a v-if="visualizations.length > 1 && !allVisualizations"
             class="viewAllPlots"
             @click="allVisualizations = true">
            See all plots
          </a>
          <a v-else-if="allVisualizations"
             class="viewAllPlots"
             @click="allVisualizations = false">
            View only one plot
          </a>
          <span v-else-if="visualizations.length === 0">Preview not available.</span>
        </section>
      </section>
    </main>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import axios from 'axios'
import {getIconUrl, humanReadableSize, humanReadableDate, sortVisualizations} from '../lib'
import { DevMode } from '../lib/DevMode'
import { File } from '../../../backend/src/entity/File'
import {Visualization} from '../../../backend/src/entity/Visualization'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'

@Component
export default class FileView extends Vue {
  @Prop() uuid!: string
  response: File | null = null
  visualizations: Visualization[] | [] = []
  versions: string[] = []
  error = false
  quicklookUrl = process.env.VUE_APP_QUICKLOOKURL
  apiUrl = process.env.VUE_APP_BACKENDURL
  humanReadableSize = humanReadableSize
  humanReadableDate = humanReadableDate
  getIconUrl = getIconUrl
  sortVisualizations = sortVisualizations
  devMode = new DevMode()
  allVisualizations = false
  sourceFiles: File[] = []
  showHistory = false

  getVisualizations() {
    if (!this.allVisualizations) return this.visualizations.slice(0, 1)
    return this.visualizations
  }

  get currentVersionIndex() {
    if (this.response == null) return null
    const response = this.response
    return this.versions.findIndex(uuid => uuid == response.uuid)
  }

  get newestVersion() {
    if (!this.currentVersionIndex) return null
    return this.versions[0]
  }
  get previousVersion() {
    if (this.currentVersionIndex == null) return null
    return this.versions[this.currentVersionIndex + 1]
  }

  get nextVersion() {
    if (!this.currentVersionIndex) return null
    return this.versions[this.currentVersionIndex - 1]
  }

  created() {
    this.onUuidChange()
  }

  fetchVisualizations(payload: {}) {
    return axios
      .get(`${this.apiUrl}visualizations/${this.uuid}`, payload)
      .then(response => {
        this.visualizations = sortVisualizations(response.data.visualizations)
      })
      .catch()
  }

  fetchFileMetadata(payload: {}) {
    return axios
      .get(`${this.apiUrl}files/${this.uuid}`, payload)
      .then(response => {
        this.response = response.data
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
  }

  fetchVersions(file: File) {
    // No need to reload versions
    if (this.versions.includes(file.uuid)) return
    const payload = {
      params: {
        developer: this.devMode.activated || undefined,
        location: file.site.id,
        product: file.product.id,
        dateFrom: file.measurementDate,
        dateTo: file.measurementDate,
        allVersions: true
      }
    }
    return axios
      .get(`${this.apiUrl}search`, payload)
      .then(response => {
        const searchFiles = response.data as SearchFileResponse[]
        this.versions = searchFiles.map(sf => sf.uuid)
      })
  }

  fetchSourceFiles(response: File) {
    if (!response.sourceFileIds) return
    return Promise.all(response.sourceFileIds.map(uuid => axios.get(`${this.apiUrl}files/${uuid}`)))
      .then(response => this.sourceFiles = response.map(res => res.data))
  }

  @Watch('uuid')
  onUuidChange() {
    const payload = { params: { developer: this.devMode.activated || undefined}}
    return this.fetchFileMetadata(payload)
      .then(() => {
        if (this.response == null || this.error) return
        this.fetchVisualizations(payload)
        this.fetchVersions(this.response)
        this.fetchSourceFiles(this.response)
      })
  }
}
</script>
