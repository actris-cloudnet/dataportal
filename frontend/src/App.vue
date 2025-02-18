<script lang="ts" setup>
import TheHeader from "@/components/TheHeader.vue";
import AdminHeader from "@/components/AdminHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import ConsentPopup from "@/components/ConsentPopup.vue";
import { isAuthenticated } from "@/lib/auth";
</script>

<template>
  <div id="app">
    <AdminHeader v-if="isAuthenticated" />
    <TheHeader />
    <div id="content">
      <router-view></router-view>
    </div>
    <TheFooter />
    <ConsentPopup />
  </div>
</template>

<style lang="scss">
@use "./sass/global.scss";

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

#content {
  flex: 1 1 0;
}
</style>
