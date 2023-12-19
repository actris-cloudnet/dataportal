<template>
  <div>
    <LandingHeader title="Send feedback!" />
    <main class="pagewidth">
      <form @submit.prevent="sendFeedback">
        <span> Let us know your thoughts to enhance our services. </span>
        <label id="name-label" for="name"><strong>Name</strong> (optional)</label>
        <input type="text" id="name" name="name" v-model="name" />
        <label for="email"><strong>Email</strong> (optional)</label>
        <input type="email" id="email" name="email" v-model="email" />
        <label for="message"><strong>Message</strong></label>
        <textarea name="message" required v-model="message"></textarea>
        <BaseButton type="primary" :disabled="!isActive">Submit</BaseButton>
        <BaseAlert type="note" v-if="!isActive"> {{ msg }} </BaseAlert>
      </form>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { ref } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import BaseAlert from "@/components/BaseAlert.vue";
import BaseButton from "@/components/BaseButton.vue";

const name = ref("");
const email = ref("");
const message = ref("");
const msg = "Thank you for your feedback!";
let isActive = ref(true);

async function sendFeedback() {
  const feedback = {
    name: name.value,
    email: email.value,
    message: message.value,
  };

  try {
    name.value = "";
    email.value = "";
    message.value = "";
    isActive.value = false;
    axios.post(`${backendUrl}slack`, feedback);
    await timeout(1750);
  } catch (error) {
    console.error(error);
  } finally {
    isActive.value = true;
  }
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";
main {
  margin-bottom: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
}

strong {
  font-weight: bold;
}

input,
textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea {
  height: 250px;
}

#name-label {
  margin-top: 1.5rem;
}

button {
  width: 100px;
  cursor: pointer;
}
</style>
