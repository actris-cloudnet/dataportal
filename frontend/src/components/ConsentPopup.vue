<script setup lang="ts">
import { ActiveConsent } from "@/lib/ActiveConsent";
import { ref } from "vue";
import BaseButton from "@/components/BaseButton.vue";

const activeConsent = new ActiveConsent();
const askConsent = ref(activeConsent.askConsent);

function consent() {
  activeConsent.consent();
  askConsent.value = false;
}
</script>

<template>
  <div class="consent" v-if="askConsent">
    We monitor site traffic. Read our
    <router-link to="/privacy">privacy policy</router-link>.
    <BaseButton type="primary" @click="consent()">OK</BaseButton>
  </div>
</template>

<style scoped lang="scss">
.consent {
  position: fixed;
  background: white;
  width: 100%;
  bottom: 0;
  text-align: center;
  z-index: 100;
  padding: 1em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

:deep(.button) {
  margin-left: 1rem;
}
</style>
