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
  <div id="consent" v-if="askConsent">
    We monitor site traffic. Read our
    <router-link to="/privacy">privacy policy</router-link>.
    <BaseButton type="primary" @click="consent()">OK</BaseButton>
  </div>
</template>
