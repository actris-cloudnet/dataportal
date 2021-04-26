<style scoped lang="sass">
@import "../sass/variables.sass"
@import "../sass/global.sass"
@import "../sass/landing.sass"

div.flex
  display: flex
  justify-content: center
  flex-wrap: wrap

main.column
  flex-direction: column
  align-content: flex-start
  margin-right: 80px
  margin-bottom: 40px
@media screen and (max-width: $narrow-screen)
  main.column
    margin-right: 0

.rightView
  flex: 1 1 600px

  > h3
    margin-top: 2em
    margin-bottom: 0.7em
  > h3:nth-child(1)
    margin-top: 0

.internalNavi
  margin-bottom: 2em
  text-align: center

  > a
    margin: 0

.router-link-active
  color: black
  font-weight: bold
  text-decoration: none
  cursor: default

.download
  display: inline-block
  margin-top: 0.5em

#editCollection
  ul
    margin-top: 0.5em
  li
    list-style: none
  h4
    margin-top: 1em
  .infobox
    padding: 1em

</style>


<template>
  <main id="collectionlanding" v-if="!error && response">
    <img id="backButton" :src="require('../assets/icons/back.png')" @click="$router.back()">
    <header>
      <h2>{{ response.title || 'Custom collection' }}</h2>
    </header>
    <div class="flex">
      <main class="info column">
        <section id="summary">
          <header>Summary</header>
          <section class="details">
            <dl>
              <dt>Date span</dt>
              <dd>{{ startDate }} - {{ endDate }}</dd>
              <dt>File count</dt>
              <dd>{{ sortedFiles.length }}</dd>
              <dt>Total size</dt>
              <dd>{{humanReadableSize(combinedFileSize(this.sortedFiles)) }}</dd>
              <dt v-if="response.downloadCount">Download count</dt>
              <dd v-if="response.downloadCount">{{ response.downloadCount }}</dd>
            </dl>
          </section>
        </section>
        <section id="sitemap" v-if="sites.length > 0">
          <header>Sites</header>
          <section class="details">
            <Map
                :sites="sites"
                :center="[34.00, -14.00]"
                :zoom="1"
            ></Map>
          </section>
        </section>
        <section id="products">
          <header>Products</header>
          <section class="details">
            <div v-for="product in products" :key="product.id">
              <img :src="getIconUrl(product.id)" class="product">
              {{ product.humanReadableName }}
            </div>
          </section>
        </section>
      </main>
      <div class="rightView">
        <nav class="internalNavi">
          <router-link :to="{path: `general`}" :replace="true" v-bind:class="{ 'router-link-active': mode === 'general' }">
            General
          </router-link> |
          <router-link :to="{path: `files`}" :replace="true" v-bind:class="{ 'router-link-active': mode === 'files' }">
            All files
          </router-link>
        </nav>
        <section id="editCollection" class="rightView" v-if="mode === 'general'">
          <h3>How to cite</h3>
          <!-- eslint-disable max-len -->
          <span v-if="busy">Generating persistent identifier...</span>
          <div v-else-if="pidServiceError" class="errormsg">PID service is unavailable. Please try again later. You may still download the collection.</div>
          <how-to-cite
              v-else
              :pid="response.pid"
              :products="getUnique(this.sortedFiles, 'product')"
              :sites="getUnique(this.sortedFiles, 'site')"
              :nonModelSiteIds="this.nonModelSiteIds"
              :modelIds="getUnique(this.sortedFiles, 'modelId')"
              :collectionYear="collectionYear"
              :startDate="startDate"
              :endDate="endDate"
          >
          </how-to-cite>

          <h3>License</h3>
          <license></license>

          <h3>Download</h3>
          By clicking the download button you confirm that you have taken notice of the above data licensing information.<br>
          <a class="download" :href="downloadUrl" id="downloadCollection">
            Download collection
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </a>
        </section>
        <data-search-result
            v-else
            :simplifiedView="true"
            :apiResponse="sortedFiles"
            :isBusy="busy"
            :downloadUri="downloadUrl">
        </data-search-result>
      </div>
    </div>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {CollectionResponse} from '../../../backend/src/entity/CollectionResponse'
import {combinedFileSize, constructTitle, getProductIcon, humanReadableSize} from '../lib'
import {Site} from '../../../backend/src/entity/Site'
import Map from '../components/Map.vue'
import {Product} from '../../../backend/src/entity/Product'
import DataSearchResult from '../components/DataSearchResult.vue'
import HowToCite from '../components/HowToCite.vue'
import License from '../components/License.vue'
import {CollectionFileResponse} from '../../../backend/src/entity/CollectionFileResponse'

Vue.component('data-search-result', DataSearchResult)
Vue.component('how-to-cite', HowToCite)
Vue.component('license', License)

@Component({
  components: {Map}
})
export default class CollectionView extends Vue {
  @Prop() uuid!: string
  @Prop() mode!: string
  error = false
  response: CollectionResponse | null = null
  sortedFiles: CollectionFileResponse[] = []
  sites: Site[] = []
  products: Product[] = []
  apiUrl = process.env.VUE_APP_BACKENDURL
  busy = false
  pidServiceError = false
  nonModelSiteIds: string[] = []

  combinedFileSize = combinedFileSize
  humanReadableSize = humanReadableSize
  getIconUrl = getProductIcon

  get startDate() {
    return this.sortedFiles[this.sortedFiles.length - 1].measurementDate
  }

  get endDate() {
    return this.sortedFiles[0].measurementDate
  }

  get collectionYear() {
    if (!this.response) return null
    return new Date(this.response.createdAt).getFullYear()
  }

  get downloadUrl() {
    if (!this.response) return null
    return `${this.apiUrl}download/collection/${this.response.uuid}`
  }

  getUnique(arr: CollectionFileResponse[], field: keyof CollectionFileResponse) {
    return arr
      .map(file => file[field])
      .reduce((acc: string[], cur) =>
        (typeof cur == 'string' && !acc.includes(cur))
          ? acc.concat([cur])
          : acc,
      [])
  }

  get size() {
    return combinedFileSize(this.sortedFiles)
  }

  async generatePid() {
    if (!this.response || this.response.pid) return
    this.busy = true
    const payload = {
      type: 'collection',
      uuid: this.uuid
    }
    return axios.post(`${this.apiUrl}generate-pid`, payload)
      .then(({data}) => {
        if (!this.response) return
        this.response.pid = data.pid
      })
      .catch(e => {
        this.pidServiceError = true
        // eslint-disable-next-line no-console
        console.error(e)
      })
      .finally(() => (this.busy = false))
  }

  created() {
    return axios.get(`${this.apiUrl}collection/${this.uuid}`)
      .then(res => {
        this.response = res.data
        if (this.response == null) return
        this.sortedFiles = constructTitle(this.response.files
          .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()))
        this.nonModelSiteIds = this.getUnique(this.sortedFiles
            .filter(file => file.productId != 'model'), 'siteId')
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
      .then(() => {
        this.generatePid()
        const siteIds = this.getUnique(this.sortedFiles, 'siteId')
        const productIds = this.getUnique(this.sortedFiles, 'productId')
        return Promise.all([
          axios.get(`${this.apiUrl}sites/`),
          axios.get(`${this.apiUrl}products/`),
        ]).then(([sites, products]) => {
          this.sites = sites.data.filter((site: Site) => siteIds.includes(site.id))
          this.products = products.data.filter((product: Product) => productIds.includes(product.id))
        })
      })
      // eslint-disable-next-line no-console
      .catch(console.error)
  }
}
</script>
