<style scoped lang="sass">
h1
  margin-bottom: 2rem

</style>

<template>
  <main>
    <h1>Cloudnet publications</h1>
    <ul id="pub-list">
      <li v-for="pub in publications" :key="pub.citation">
        <p v-html="pub.citation"></p>
      </li>
    </ul>
  </main>
</template>


<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import axios from 'axios'

@Component({
  components: {}
})
export default class PubView extends Vue {
  apiUrl = process.env.VUE_APP_BACKENDURL
  publications: any

  data() {
    return {
      publications: null
    }
  }

  async created() {
    axios
      .get(`${this.apiUrl}publications`)
      .then(response => (this.publications = response.data))
  }

}

</script>
