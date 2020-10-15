<style scoped lang="sass">
h1
  font-size: 4em
  text-align: center

h2
  text-align: center

section
  margin-top: 2em
  margin-left: auto
  margin-right: auto
  width: 35em
  text-align: center
  display: block
</style>

<template>
    <main id="error">
        <h1>{{ response.status }}</h1>
        <h2 v-if="response.status !== 500">{{ message }}</h2>
        <h2 v-else>Internal server error</h2>
        <section v-if="response.status === 404">
        The file you are looking for does not exist.<br>
        If you are looking for the old devcloudnet data portal, click <a href="http://devcloudnet.fmi.fi">here</a>.<br>
        If you are looking for the legacy cloudnet site, click <a href="http://legacy.cloudnet.fmi.fi">here</a>.
        </section>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { AxiosResponse } from 'axios'

@Component
export default class ApiError extends Vue {
  @Prop() response!: AxiosResponse

  message = typeof this.response.data == 'string' ? this.response.data : this.response.data.errors.join('<br>')
}
</script>
