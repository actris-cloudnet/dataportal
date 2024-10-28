<template>
  <div class="container">
    <LandingHeader title="Contact" />
    <main class="pagewidth">
      <form @submit.prevent="sendFeedback">
        <div>
          Do you have questions or feedback about the Cloudnet data portal? You can reach us by sending email to
          <a href="mailto:actris-cloudnet@fmi.fi">actris-cloudnet@fmi.fi</a> or by filling the form below.
        </div>
        <label id="name-label" for="name"><strong>Name</strong> (optional)</label>
        <input id="name" type="text" name="name" v-model="name" />
        <label id="email-label" for="email"><strong>Email</strong> (optional)</label>
        <input id="email" type="email" name="email" v-model="email" />
        <label id="message-label" for="message"><strong>Message</strong></label>
        <textarea id="message" name="message" required v-model="message"></textarea>
        <BaseButton type="primary" :disabled="!isActive" htmlType="submit">Submit</BaseButton>
        <BaseAlert :type="isError ? 'error' : 'note'" v-if="!isActive">{{ msg }}</BaseAlert>
      </form>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { computed, ref } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import BaseAlert from "@/components/BaseAlert.vue";
import BaseButton from "@/components/BaseButton.vue";

const name = ref("");
const email = ref("");
const message = ref("");
let isActive = ref(true);
let isError = ref(false);

async function sendFeedback() {
  const feedback = {
    name: name.value,
    email: email.value,
    message: message.value,
  };

  try {
    isActive.value = false;
    await axios.post(`${backendUrl}feedback`, feedback);
    name.value = "";
    email.value = "";
    message.value = "";
  } catch (error) {
    console.error("Form submission error:", error);
    isError.value = true;
  } finally {
    await timeout(1750);
    isActive.value = true;
    isError.value = false;
  }
}

const msg = computed(() => {
  if (isError.value) {
    return "Something went wrong. Please try again later.";
  } else {
    return "Thank you for your feedback!";
  }
});

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";
.container {
  margin-bottom: 2rem;
  margin: 0 auto;
  max-width: 700px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
