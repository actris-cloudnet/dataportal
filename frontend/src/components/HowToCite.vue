<style scoped lang="sass">
@import "@/sass/variables.sass"
@import "@/sass/global.sass"
</style>

<template>
  <!-- eslint-disable max-len -->
  <section id="howtocite">
    This is an example of how to cite Cloudnet datasets. You may edit the text to suit publication standards.
    <div class="infobox infocolor">
      <h4>Data availability</h4>
      <div class="citationtext" v-html="dataAvailability"></div>
      <h4>Acknowledgements</h4>
      <div class="citationtext" v-html="acknowledgements"></div>
      <h4>Citation</h4>
      <div class="citationtext" v-html="citation"></div>
    </div>
  </section>
</template>

<script lang="ts" setup>
export interface Props {
  dataAvailability: string;
  acknowledgements: string;
  citation: string;
}

defineProps<Props>();
</script>
