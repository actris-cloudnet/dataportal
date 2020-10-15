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
  margin-right: 80px

#editCollection
  flex-basis: 800px

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
              <dt>PID</dt>
              <dd>{{ response.pid || 'Not assigned'}}</dd>
              <dt>Date span</dt>
              <dd>{{ startDate }} - {{ endDate }}</dd>
              <dt>Number of files</dt>
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
                :center="[54.00, 14.00]"
                :zoom="3"
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
      <section id="editCollection" v-if="response.downloadCount == 0">
        <h3>Edit collection</h3>
        <ul>
          <li>Generate pid</li>
          <li>How to cite</li>
          <li>License information?</li>
          <li>Download!</li>
        </ul>

      </section>
    </div>
  </main>
  <app-error v-else-if="error" :response="response"></app-error>
</template>


<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import axios from 'axios'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import {CollectionResponse} from '../../../backend/src/entity/CollectionResponse'
import {combinedFileSize, getIconUrl, humanReadableSize} from '../lib'
import {Site} from '../../../backend/src/entity/Site'
import Map from '../components/Map.vue'
import {Product} from '../../../backend/src/entity/Product'


@Component({
  components: {Map}
})
export default class CollectionView extends Vue {
  @Prop() uuid!: string
  error = false
  response: CollectionResponse | null = null
  sortedFiles: SearchFileResponse[] = []
  sites: Site[] = []
  products: Product[] = []
  apiUrl = process.env.VUE_APP_BACKENDURL

  combinedFileSize = combinedFileSize
  humanReadableSize = humanReadableSize
  getIconUrl = getIconUrl

  get startDate() {
    return this.sortedFiles[this.sortedFiles.length - 1].measurementDate
  }

  get endDate() {
    return this.sortedFiles[0].measurementDate
  }

  getUnique(field: keyof SearchFileResponse) {
    return this.sortedFiles
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

  created() {
    axios.get(`${this.apiUrl}collection/${this.uuid}`)
      .then(res => {
        this.response = res.data
        if (this.response == null) return
        this.sortedFiles = this.response.files
          .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
      })
      .catch(({response}) => {
        this.error = true
        this.response = response
      })
      .then(() => {
        const siteIds = this.getUnique('siteId')
        const productIds = this.getUnique('productId')
        return Promise.all([
          axios.get(`${this.apiUrl}sites/`),
          axios.get(`${this.apiUrl}products/`)
        ]).then(([sites, products]) => {
          this.sites = sites.data.filter((site: Site) => siteIds.includes(site.id))
          this.products = products.data.filter((product: Product) => productIds.includes(product.id))
        })
      })
      .catch(console.error)
  }
}
</script>
