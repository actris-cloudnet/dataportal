<template>
    <main class="error">
        <h2>Error {{ response.status }} - {{ response.data }}</h2>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ApiError extends Vue {
  @Prop() response!: Response
}
</script>