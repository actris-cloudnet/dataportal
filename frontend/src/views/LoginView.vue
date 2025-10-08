<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/BaseButton.vue";
import orcidLogo from "@/assets/logos/orcid.svg";
import { login } from "@/lib/auth";
import { backendUrl } from "@/lib";

const username = ref("");
const password = ref("");
const error = ref("");
const route = useRoute();
const router = useRouter();

async function submit() {
  try {
    await login(username.value, password.value);
    await router.push(typeof route.query.next === "string" ? route.query.next : { name: "Frontpage" });
  } catch (err: any) {
    console.error(err);
    error.value = err;
  }
}
</script>

<template>
  <div class="container">
    <BaseButton type="primary" htmlType="submit" class="button" :href="`${backendUrl}auth/orcid`">
      <img :src="orcidLogo" width="16" height="16" class="orcid" />
      Sign in with ORCID
    </BaseButton>
    <p class="separator">or</p>
    <form @submit.prevent="submit">
      <input type="text" placeholder="Username" v-model="username" required />
      <input type="password" placeholder="Password" v-model="password" required />
      <div class="error" v-if="error">{{ error }}</div>
      <BaseButton type="brand" htmlType="submit" class="button">Log in</BaseButton>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.container {
  margin: 5rem auto;
  width: 200px;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;

  &::placeholder {
    color: gray;
  }
}

.button {
  width: 100%;
}

.error {
  color: red;
}

.orcid {
  margin-right: 0.5rem;
}

.separator {
  color: gray;
  margin-top: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}
</style>
