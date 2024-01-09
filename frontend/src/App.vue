<script lang="ts" setup>
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import ConsentPopup from "@/components/ConsentPopup.vue";
</script>

<template>
  <div id="app">
    <TheHeader />
    <div id="content">
      <router-view></router-view>
    </div>
    <TheFooter />
    <ConsentPopup />
  </div>
</template>

<style lang="scss">
@import "./sass/global.scss";

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

#content {
  flex: 1 1 0;
}
</style>
