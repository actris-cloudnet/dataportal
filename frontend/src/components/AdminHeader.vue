<script lang="ts" setup>
import { hasPermission, loginStore, logout } from "@/lib/auth";
</script>

<template>
  <header>
    <div class="container pagewidth">
      <span class="title">Secret pages:</span>
      <router-link v-if="hasPermission('canPublishTask').value" :to="{ name: 'Queue' }">Queue</router-link>
      <router-link v-if="hasPermission('canGetStats').value" :to="{ name: 'Statistics' }">Statistics</router-link>
      <span class="title" style="margin-left: auto">{{ loginStore.username }}:</span>
      <a href="#" class="logout" @click="logout">Log out</a>
    </div>
  </header>
</template>

<style scoped lang="scss">
@import "@/sass/variables.scss";

header {
  background-color: $blue4;
  color: white;
  font-size: 90%;
  padding: 0.25rem;
}

.container {
  display: flex;
  gap: 1rem;
}

a {
  color: inherit;
}

.title {
  font-weight: 600;
}
</style>
