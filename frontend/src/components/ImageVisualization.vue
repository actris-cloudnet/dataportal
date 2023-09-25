<style scoped lang="scss">
figcaption {
  text-align: center;
  font-weight: 400;
  position: relative;
  z-index: 1;
}

.visualization {
  width: 100%;
  height: auto;
}

// TODO: space between caption and image
// figcaption + * {
//   display: block;
//   margin-top: -.35rem;
// }
.tag {
  background-color: #eee;
  font-size: 65%;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;

  &:hover {
    opacity: 0.9;
  }
}

img {
  display: block;
}
</style>

<template>
  <figure>
    <figcaption :style="captionStyle">
      {{ currentData.productVariable.humanReadableName }}
      <a
        :href="currentData.productVariable.actrisVocabUri"
        title="Definition for the variable in ACTRIS vocabulary"
        class="tag"
        v-if="linkToVocabulary && currentData.productVariable.actrisVocabUri"
      >
        definition
      </a>
    </figcaption>
    <a v-if="expandable" :href="imageUrl" target="_blank">
      <img
        :src="imageUrl"
        :width="currentData.dimensions?.width"
        :height="currentData.dimensions?.height"
        alt=""
        class="visualization"
        :style="imageStyle"
        @load="onLoad"
      />
    </a>
    <router-link :to="linkTo" v-else-if="linkTo">
      <img
        :src="imageUrl"
        :width="currentData.dimensions?.width"
        :height="currentData.dimensions?.height"
        alt=""
        class="visualization"
        :style="imageStyle"
        @load="onLoad"
      />
    </router-link>
    <img
      v-else
      :src="imageUrl"
      :width="currentData.dimensions?.width"
      :height="currentData.dimensions?.height"
      alt=""
      class="visualization"
      :style="imageStyle"
      @load="onLoad"
    />
  </figure>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from "vue-router";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import { computed, ref, watchEffect } from "vue";

export interface Props {
  data: VisualizationItem;
  maxMarginLeft?: number;
  maxMarginRight?: number;
  linkToVocabulary?: boolean;
  linkTo?: RouteLocationRaw;
  expandable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expandable: false,
  linkToVocabulary: false,
  maxMarginLeft: 0,
  maxMarginRight: 0,
});

const emit = defineEmits<{
  (e: "load"): void;
}>();

const currentData = ref(props.data);
const nextData = ref(props.data);

const imageStyle = computed(() => {
  if (
    !currentData.value.dimensions ||
    typeof props.maxMarginLeft === "undefined" ||
    typeof props.maxMarginRight === "undefined"
  ) {
    return {};
  }
  const left = props.maxMarginLeft - currentData.value.dimensions.marginLeft;
  const right = props.maxMarginRight - currentData.value.dimensions.marginRight;
  const width = currentData.value.dimensions.width + left + right;
  return {
    paddingLeft: `${(100 * left) / width}%`,
    paddingRight: `${(100 * right) / width}%`,
  };
});

const captionStyle = computed(() => {
  if (
    !currentData.value.dimensions ||
    typeof props.maxMarginLeft === "undefined" ||
    typeof props.maxMarginRight === "undefined"
  ) {
    return {};
  }
  const left = props.maxMarginLeft;
  const right = props.maxMarginRight;
  const width = currentData.value.dimensions.width + left + right;
  return {
    paddingLeft: `${100 * (left / width)}%`,
    paddingRight: `${100 * (right / width)}%`,
  };
});

const imageUrl = computed(() => `${import.meta.env.VITE_BACKEND_URL}download/image/${nextData.value.s3key}`);

watchEffect(() => {
  nextData.value = props.data;
});

function onLoad() {
  currentData.value = nextData.value;
  emit("load");
}
</script>
