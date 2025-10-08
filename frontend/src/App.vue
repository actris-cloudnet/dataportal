<script lang="ts" setup>
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import ConsentPopup from "@/components/ConsentPopup.vue";
import { hasPermission, loginStore } from "@/lib/auth";
</script>

<template>
  <div id="app">
    <TheHeader />
    <div id="content">
      <div
        v-if="loginStore.isAuthenticated && $route.meta.permission && !hasPermission($route.meta.permission).value"
        id="unauthorized"
      >
        <h1>Unauthorized</h1>
        <p>You don't have the permission to view this page.</p>
      </div>
      <router-view v-else></router-view>
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

#unauthorized {
  text-align: center;
  margin: 1rem;

  h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}
</style>
