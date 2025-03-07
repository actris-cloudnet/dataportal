<template>
  <div v-if="productInfo.status === 'ready'">
    <LandingHeader :title="productInfo.value.humanReadableName" subtitle="Cloudnet product">
      <template #tags>
        <BaseTag v-if="productInfo.value.experimental" type="experimental" title="Experimental product">
          Experimental
        </BaseTag>
      </template>
    </LandingHeader>
    <main class="pagewidth">
      <h2>Description</h2>
      <p>{{ productInfo.variables.description }}</p>
      <template v-if="productInfo.value.sourceInstruments.length > 0">
        <p>Cloudnet supports the following instruments:</p>
        <ul>
          <li v-for="sourceInstrument in productInfo.value.sourceInstruments" :key="sourceInstrument.id">
            <img :src="getProductIcon(productInfo.value.id)" alt="" class="product-icon" />
            {{ sourceInstrument.humanReadableName }}
          </li>
        </ul>
      </template>
      <template v-if="productInfo.value.sourceProducts.length > 0">
        <p>The {{ lowerCaseProductName(productInfo.value) }} product is based on these products:</p>
        <ul>
          <li v-for="sourceProduct in productInfo.value.sourceProducts" :key="sourceProduct.id">
            <router-link :to="{ name: 'Product', params: { product: sourceProduct.id } }">
              <img :src="getProductIcon(sourceProduct.id)" alt="" class="product-icon" />
              {{ sourceProduct.humanReadableName }}
            </router-link>
          </li>
        </ul>
      </template>
      <template v-if="productInfo.value.derivedProducts.length > 0">
        <p>The {{ lowerCaseProductName(productInfo.value) }} product is used for generating these products:</p>
        <ul>
          <li v-for="derivedProduct in productInfo.value.derivedProducts" :key="derivedProduct.id">
            <router-link :to="{ name: 'Product', params: { product: derivedProduct.id } }">
              <img :src="getProductIcon(derivedProduct.id)" alt="" class="product-icon" />
              {{ derivedProduct.humanReadableName }}
            </router-link>
          </li>
        </ul>
      </template>
      <template v-if="productInfo.variables.references_html.length > 0">
        <h2>References</h2>
        <ul class="references">
          <li v-for="reference in productInfo.variables.references_html" :key="reference" v-html="reference"></li>
        </ul>
      </template>
      <template v-for="section in sections" :key="section">
        <h2>{{ titles[section] }}</h2>
        <p v-if="section in descriptions">
          {{ descriptions[section] }}
        </p>
        <div class="variable" v-for="variable in productInfo.variables[section]" :key="variable.name">
          <code>{{ variable.name }}</code> – {{ variable.long_name }}<br />
          <table>
            <tbody>
              <tr v-if="variable.dimensions && variable.dimensions.length > 0">
                <th>Dimensions</th>
                <td>{{ variable.dimensions.join(", ") }}</td>
              </tr>
              <tr v-if="variable.units">
                <th>Units</th>
                <td v-html="unitsHtml(variable.units)"></td>
              </tr>
              <tr v-if="variable.dtype">
                <th>Data type</th>
                <td>{{ variable.dtype }}</td>
              </tr>
              <tr v-if="variable.standard_name">
                <th>Standard name</th>
                <td>{{ variable.standard_name }}</td>
              </tr>
              <tr v-if="variable.comment">
                <th>Description</th>
                <td>{{ variable.comment }}</td>
              </tr>
              <tr v-if="variable.definition">
                <th>Definition</th>
                <td>
                  <table class="definition">
                    <tr v-for="definition in variable.definition" :key="definition.label">
                      <th>{{ definition.label }}:</th>
                      <td>{{ definition.description }}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </main>
  </div>
  <ApiError :response="(productInfo.error as any).response" v-else-if="productInfo.status === 'error'" />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import axios from "axios";

import type { Product } from "@shared/entity/Product";
import { backendUrl, getProductIcon } from "@/lib";
import LandingHeader from "@/components/LandingHeader.vue";
import BaseTag from "@/components/BaseTag.vue";
import ApiError from "@/views/ApiError.vue";
import productData from "@/assets/products.json";

export interface Props {
  product: string;
}

const props = defineProps<Props>();

type ProductResult =
  | { status: "loading" }
  | { status: "ready"; value: Product; variables: any }
  | { status: "error"; error: Error };

const productInfo = ref<ProductResult>({ status: "loading" });

function unitsHtml(units: string): string {
  return units.replace(/([a-z])(-?\d+)/gi, "$1<sup>$2</sup>");
}

const sections = ["dimensions", "common_variables"];

type Section = (typeof sections)[number];

const titles: Record<Section, string> = {
  dimensions: "Dimensions",
  common_variables: "Variables",
};

const descriptions: Record<Section, string> = {
  common_variables:
    "The following variables are available in all products of this type but additional variables may be present depending on the source instrument.",
};

const lowerCaseProductName = (product: Product) =>
  product.humanReadableName.toLowerCase().replace("mwr", "MWR").replace("doppler", "Doppler").replace("tke", "TKE");

watch(
  () => props.product,
  async () => {
    try {
      const res = await axios.get<Product>(`${backendUrl}products/${props.product}`);
      const variables = (productData as any)[props.product];
      if (variables) {
        productInfo.value = { status: "ready", value: res.data, variables };
      } else {
        const error = new Error();
        (error as any).response = { status: 404, data: "Not found" };
        productInfo.value = { status: "error", error };
      }
    } catch (error) {
      productInfo.value = { status: "error", error: error as Error };
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
h2 {
  font-size: 150%;
  margin-top: 3rem;
  margin-bottom: 2rem;

  &:first-child {
    margin-top: 1rem;
  }
}

.variable {
  margin-bottom: 1rem;

  > table {
    margin-top: 1rem;
    margin-left: 2rem;
    max-width: 1000px;

    > tbody > tr > th {
      padding-right: 1rem;
      width: 150px;
    }
  }
}

th {
  font-weight: 500;
  text-wrap: nowrap;
}

.definition th {
  padding-right: 0.5rem;
}

code {
  background: #eee;
  padding: 2px;
  border-radius: 4px;
  font-size: 90%;
}

p {
  margin-bottom: 1rem;
  max-width: 800px;
}

ul {
  margin: 1rem 0;
}

.references {
  margin-left: 2rem;
  max-width: 800px;
  text-indent: -2rem;

  li + li {
    margin-top: 0.5rem;
  }

  :deep(i) {
    font-style: italic;
  }
}

.product-icon {
  height: 1.1rem;
  margin-right: 0.25rem;
  vertical-align: middle;
}
</style>
