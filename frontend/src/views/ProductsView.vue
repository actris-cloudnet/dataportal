<template>
  <div v-if="products.status === 'ready'">
    <LandingHeader title="Products" />
    <main class="pagewidth">
      <p>
        Cloudnet data are organised in daily products and stored in netCDF 4 file format. For more information, see
        <a href="https://docs.cloudnet.fmi.fi/netcdf.html">Cloudnet NetCDF Convention</a>.
      </p>
      <h2>Instrument products</h2>
      <p>
        Measurements from an instrument or a model in a harmonised format with some additional processing such as
        background noise screening.
      </p>
      <ul>
        <li v-for="product in instrumentProducts" :key="product.id">
          <router-link :to="{ name: 'Product', params: { product: product.id } }">
            <img :src="getProductIcon(product.id)" alt="" class="product-icon" />
            {{ product.humanReadableName }}
          </router-link>
        </li>
      </ul>
      <h2>Geophysical products</h2>
      <p>Cloud properties derived from multiple instruments of different type.</p>
      <ul>
        <li v-for="product in derivedProducts" :key="product.id">
          <router-link :to="{ name: 'Product', params: { product: product.id } }">
            <img :src="getProductIcon(product.id)" alt="" class="product-icon" />
            {{ product.humanReadableName }}
          </router-link>
        </li>
      </ul>
      <h2>Experimental products</h2>
      <p>Products based on novel methods or processing software still under development.</p>
      <ul>
        <li v-for="product in expProducts" :key="product.id">
          <router-link :to="{ name: 'Product', params: { product: product.id } }">
            <img :src="getProductIcon(product.id)" alt="" class="product-icon" />
            {{ product.humanReadableName }}
          </router-link>
        </li>
      </ul>
    </main>
  </div>
  <ApiError :response="(products.error as any).response" v-else-if="products.status === 'error'" />
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";

import type { Product } from "@shared/entity/Product";
import { backendUrl, compareValues, getProductIcon } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import ApiError from "@/views/ApiError.vue";

const alphabeticalSort = (a: Product, b: Product) => compareValues(a.humanReadableName, b.humanReadableName);

type ProductResult = { status: "loading" } | { status: "ready"; value: Product[] } | { status: "error"; error: Error };

const products = ref<ProductResult>({ status: "loading" });

const instrumentProducts = computed(() =>
  products.value.status === "ready"
    ? products.value.value
        .filter(
          (product) =>
            (product.type.includes("instrument") || product.type.includes("model")) && product.experimental === false,
        )
        .sort(alphabeticalSort)
    : [],
);
const derivedProducts = computed(() =>
  products.value.status === "ready"
    ? products.value.value
        .filter((product) => product.type.includes("geophysical") && product.experimental === false)
        .sort(alphabeticalSort)
    : [],
);
const expProducts = computed(() =>
  products.value.status === "ready"
    ? products.value.value
        .filter((product) => !product.type.includes("evaluation") && product.experimental === true)
        .sort(alphabeticalSort)
    : [],
);

onMounted(async () => {
  try {
    const res = await axios.get<Product[]>(`${backendUrl}products`);
    products.value = { status: "ready", value: res.data };
  } catch (error) {
    products.value = { status: "error", error: error as Error };
  }
});
</script>

<style scoped lang="scss">
h2 {
  font-size: 150%;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

p {
  max-width: 600px;
  margin-bottom: 1rem;
}

ul {
  max-width: 600px;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
  margin-bottom: 2rem;
}

.product-icon {
  height: 1.1rem;
  margin-right: 0.25rem;
  vertical-align: middle;
}
</style>
