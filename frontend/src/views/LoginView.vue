<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/BaseButton.vue";
import { login } from "@/lib/auth";

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
  <form @submit.prevent="submit">
    <input type="text" placeholder="Username" v-model="username" required />
    <input type="password" placeholder="Password" v-model="password" required />
    <div class="error" v-if="error">{{ error }}</div>
    <BaseButton type="primary" htmlType="submit" class="button"> Log in </BaseButton>
  </form>
</template>

<style lang="scss" scoped>
form {
  margin: 5rem auto;
  width: 200px;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.button {
  width: 100%;
}

.error {
  color: red;
}
</style>
