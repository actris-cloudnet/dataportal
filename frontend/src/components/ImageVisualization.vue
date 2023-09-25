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
      {{ data.productVariable.humanReadableName }}
      <a
        :href="data.productVariable.actrisVocabUri"
        title="Definition for the variable in ACTRIS vocabulary"
        class="tag"
        v-if="linkToVocabulary && data.productVariable.actrisVocabUri"
      >
        definition
      </a>
    </figcaption>
    <a v-if="expandable" :href="imageUrl" target="_blank">
      <img
        :src="imageUrl"
        :width="data.dimensions?.width"
        :height="data.dimensions?.height"
        alt=""
        class="visualization"
        :style="imageStyle"
        @load="$emit('load')"
      />
    </a>
    <router-link :to="linkTo" v-else-if="linkTo">
      <img
        :src="imageUrl"
        :width="data.dimensions?.width"
        :height="data.dimensions?.height"
        alt=""
        class="visualization"
        :style="imageStyle"
        @load="$emit('load')"
      />
    </router-link>
    <img
      v-else
      :src="imageUrl"
      :width="data.dimensions?.width"
      :height="data.dimensions?.height"
      alt=""
      class="visualization"
      :style="imageStyle"
      @load="$emit('load')"
    />
  </figure>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from "vue-router";
import type { VisualizationItem } from "@shared/entity/VisualizationResponse";
import { computed } from "vue";

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

const imageStyle = computed(() => {
  if (
    !props.data.dimensions ||
    typeof props.maxMarginLeft === "undefined" ||
    typeof props.maxMarginRight === "undefined"
  ) {
    return {};
  }
  const left = props.maxMarginLeft - props.data.dimensions.marginLeft;
  const right = props.maxMarginRight - props.data.dimensions.marginRight;
  const width = props.data.dimensions.width + left + right;
  return {
    paddingLeft: `${(100 * left) / width}%`,
    paddingRight: `${(100 * right) / width}%`,
  };
});

const captionStyle = computed(() => {
  if (
    !props.data.dimensions ||
    typeof props.maxMarginLeft === "undefined" ||
    typeof props.maxMarginRight === "undefined"
  ) {
    return {};
  }
  const left = props.maxMarginLeft;
  const right = props.maxMarginRight;
  const width = props.data.dimensions.width + left + right;
  return {
    paddingLeft: `${100 * (left / width)}%`,
    paddingRight: `${100 * (right / width)}%`,
  };
});

const imageUrl = computed(() => `${import.meta.env.VITE_BACKEND_URL}download/image/${props.data.s3key}`);
</script>
