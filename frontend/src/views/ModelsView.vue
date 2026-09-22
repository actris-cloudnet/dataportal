<template>
  <div>
    <LandingHeader title="Models"></LandingHeader>
    <main class="pagewidth">
      <p>
        Cloudnet provides profile data from various numerical weather prediction models at fixed locations. Together
        with ground-based measurements at the same locations, the model data is used to generate
        <router-link :to="{ name: 'Products' }">geophysical products</router-link>. In the future, we are also planning
        to evaluate the representation of clouds in the models against the measurements.
      </p>
      <ul>
        <li v-for="model in models" :key="model.id">
          <router-link :to="{ name: 'Model', params: { modelId: model.id } }">
            {{ model.humanReadableName }}
          </router-link>
        </li>
      </ul>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { backendUrl } from "@/lib";
import type { Model } from "@shared/entity/Model";
import axios from "axios";
import { onMounted, ref } from "vue";

const models = ref<Model[]>([]);

onMounted(async () => {
  const res = await axios.get<Model[]>(`${backendUrl}models`);
  models.value = res.data
    .filter((model) => !model.humanReadableName.includes("deprecated") && !model.id.startsWith("era5"))
    .sort((a, b) => a.humanReadableName.localeCompare(b.humanReadableName));
});
</script>

<style scoped lang="scss">
:deep(.pagewidth) {
  max-width: 1000px;
}

p {
  margin-bottom: 1rem;
}

ul {
  list-style: disc;
  padding-left: 1rem;
}
</style>
