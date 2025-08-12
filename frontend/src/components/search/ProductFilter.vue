<template>
  <div class="filterbox">
    <CustomMultiselect
      label="Product"
      v-model="selectedProductIds"
      :options="productOptions"
      id="productSelect"
      :multiple="true"
      :getIcon="getProductIcon"
    />
    <CheckBox
      id="showExpProductsCheckbox"
      class="checkbox"
      v-model="showExpProducts"
      label="Show experimental products"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from "vue";
import CustomMultiselect from "@/components/MultiSelect.vue";
import CheckBox from "@/components/CheckBox.vue";
import { useRouteQuery, queryBoolean, queryStringArray } from "@/lib/useRouteQuery";
import { getProductIcon } from "@/lib";
import { useProducts } from "@/composables/useProduct";

// products
const { allProducts, error: fetchError } = useProducts();

const selectedProductIds = useRouteQuery({ name: "product", defaultValue: [], type: queryStringArray });
const showExpProducts = useRouteQuery({ name: "experimental", defaultValue: false, type: queryBoolean });

const productOptions = computed(() =>
  allProducts.value.filter((product) => showExpProducts.value || !product.experimental),
);

onMounted(async () => {
  if (
    !showExpProducts.value &&
    selectedProductIds.value.some((productId) => {
      const product = allProducts.value.find((product) => product.id === productId);
      return product && product.experimental;
    })
  ) {
    showExpProducts.value = true;
  }
});
</script>
