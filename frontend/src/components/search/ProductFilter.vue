<template>
  <div class="filterbox">
    <CustomMultiselect
      label="Product"
      v-model="products"
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
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSearchStore } from "@/stores/search";
import CustomMultiselect from "@/components/MultiSelect.vue";
import CheckBox from "@/components/CheckBox.vue";
import { getProductIcon } from "@/lib";

const searchStore = useSearchStore();

const { products, showExpProducts, productOptions, allProducts } = storeToRefs(searchStore);
const { fetchProducts } = searchStore;

onMounted(() => {
  if (allProducts.value.length === 0) {
    fetchProducts();
  }
});
</script>
