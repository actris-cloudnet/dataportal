<script lang="ts" setup>
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import ConceptPopup from "@/components/ConceptPopup.vue";
</script>

<template>
  <div id="app">
    <TheHeader />
    <div id="content">
      <router-view v-slot="{ Component }">
        <keep-alive include="app-search">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <TheFooter />
    <ConceptPopup />
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
