<style scoped lang="sass">
@import "../../sass/landing-beta.sass"
</style>

<template>
  <a :href="downloadUrl">
    <svg class="download-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
    Download
  </a>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
@Component
export default class DownloadButton extends Vue {
  @Prop() downloadUrl!: string;
}
</script>
