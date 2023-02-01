<style scoped lang="sass">
.caption
  text-align: center
  font-weight: 400
  position: relative
  z-index: 1

  svg
    position: relative
    width: 1em
    height: 1em
    top: -0.15em

.visualization
  width: 100%
  height: auto

.caption + .visualization
  margin-top: -.35rem
</style>

<template>
  <div v-if="caption">
    <div class="caption">
      {{ data.productVariable.humanReadableName }}
      <a :href="data.productVariable.actrisVocabUri" v-if="data.productVariable.actrisVocabUri" title="ACTRIS variable">
        <svg
          class="link"
          fill="#000000"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 30 30"
          width="16px"
          height="16px"
        >
          <path
            d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"
          />
        </svg>
      </a>
    </div>
    <a v-if="expandable" :href="imageUrl()" target="_blank">
      <img
        :src="imageUrl()"
        :width="data.dimensions && data.dimensions.width"
        :height="data.dimensions && data.dimensions.height"
        alt=""
        class="visualization"
        :style="imageStyle"
      />
    </a>
    <router-link :to="linkTo" v-else-if="linkTo">
      <img
        :src="imageUrl()"
        :width="data.dimensions && data.dimensions.width"
        :height="data.dimensions && data.dimensions.height"
        alt=""
        class="visualization"
        :style="imageStyle"
      />
    </router-link>
    <img
      v-else
      :src="imageUrl()"
      :width="data.dimensions && data.dimensions.width"
      :height="data.dimensions && data.dimensions.height"
      alt=""
      class="visualization"
      :style="imageStyle"
      @load="$emit('load')"
    />
  </div>
  <!-- TODO: remove legacy layout in the future. -->
  <img
    v-else
    :src="imageUrl()"
    :width="data.dimensions && data.dimensions.width"
    :height="data.dimensions && data.dimensions.height"
    alt=""
    class="visualization"
    :style="imageStyle"
    @load="$emit('load')"
  />
</template>

<script lang="ts" setup>
import { RawLocation } from "vue-router";
import { VisualizationItem } from "../../../backend/src/entity/VisualizationResponse";

interface Props {
  data: VisualizationItem;
  maxMarginLeft?: number;
  maxMarginRight?: number;
  caption?: boolean;
  linkTo?: RawLocation;
  expandable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expandable: false,
  caption: false,
  maxMarginLeft: 0,
  maxMarginRight: 0,
});

function imageStyle() {
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
}

function imageUrl(): string {
  return `${process.env.VUE_APP_BACKENDURL}download/image/${props.data.s3key}`;
}
</script>
