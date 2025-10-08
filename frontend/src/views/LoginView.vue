<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/BaseButton.vue";
import orcidLogo from "@/assets/logos/orcid.svg";
import { login } from "@/lib/auth";
import { backendUrl } from "@/lib";
import axios from "axios";

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
    console.error("Login failed", err);
    error.value = axios.isAxiosError(err) && err?.response?.data.errors ? err.response.data.errors : err.toString();
  }
}

const orcidUrl = computed(() => {
  let url = `${backendUrl}auth/orcid`;
  if (typeof route.query.next === "string") {
    const params = new URLSearchParams();
    params.append("next", route.query.next);
    url += "?" + params.toString();
  }
  return url;
});
</script>

<template>
  <div class="container">
    <div class="error" v-if="$route.query.fail">Login using your ORCID has not been approved.</div>
    <BaseButton type="primary" htmlType="submit" class="button" :href="orcidUrl">
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
  margin-bottom: 0.5rem;
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
