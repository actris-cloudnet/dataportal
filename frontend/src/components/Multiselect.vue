<style lang="sass">
@import "../sass/variables.sass"

.nobottommargin
  margin-top: 15px

.multiselect__input
  padding: 2px
  padding-left: 0
  &::placeholder
    font-size: 88%
    color: gray

.multiselect__tags-wrap
  span, span i:hover
    color: black
    background-color: $steel-warrior

.multiselect__element
  font-size: 90%
  color: black
  .multiselect__option--highlight
    color: black
    background-color: $steel-warrior
    span
      background-color: $steel-warrior
  .multiselect__option--selected
    background-color: white
    pointer-events: none
    span
      background-color: white
      font-weight: normal
      color: #bbbbbb
      img
        opacity: 0.5

.multiselect__tag-icon:after
  color: gray

.option__image
  height: 1.2em
  width: auto
  position: relative
  top: -1px
  margin-right: 0.4em
</style>

<template>
  <div>
    <label :for="id">{{ label }}</label>
    <Multiselect
      :name="id"
      :id="id"
      :value="selectedOption"
      placeholder="Select"
      track-by="id"
      label="humanReadableName"
      :options="options"
      :show-labels="false"
      :multiple="multiple"
      :hideSelected="false"
      @input="onInput"
      @search-change="isIddqd"
    >
      <template slot="tag" slot-scope="props" v-if="icons">
        <span class="multiselect__tag">
          <img alt="option" class="option__image" :src="getIcon(props.option)" />
          {{ props.option.humanReadableName }}
          <i class="multiselect__tag-icon" @click="props.remove(props.option)"></i>
        </span>
      </template>
      <template slot="option" slot-scope="props" v-if="icons">
        <span>
          <img alt="option" v-if="icons" class="option__image" :src="getIcon(props.option)" />
          {{ props.option.humanReadableName }}
        </span>
      </template>
      <span id="noRes" slot="noResult">Not found</span>
    </Multiselect>
  </div>
</template>

<script lang="ts">
export interface Option {
  id: string;
  humanReadableName: string;
}

type OptionId = Option["id"];

export default {};
</script>

<script lang="ts" setup>
import Multiselect from "vue-multiselect";
import { DevMode } from "../lib/DevMode";
import { notEmpty } from "../lib";
import { ref, watch } from "vue";

interface Props {
  id: string;
  label: string;
  options: Option[];
  icons: boolean;
  getIcon: Function;
  devMode?: DevMode;
  multiple: boolean;
  value: OptionId | OptionId[] | null;
}

const props = defineProps<Props>();

const emit = defineEmits(["input"]);

const selectedOption = ref<Option | Option[] | null>(null);

watch(
  () => props.value,
  (value) => {
    if (Array.isArray(value)) {
      selectedOption.value = value.map((v) => props.options.find((option) => option.id === v)).filter(notEmpty);
    } else {
      const result = props.options.find((option) => option.id === value);
      selectedOption.value = result !== undefined ? result : null;
    }
  }
);

function onInput(input: Option | Option[]) {
  emit("input", Array.isArray(input) ? input.map((v) => v.id) : input.id);
}

function isIddqd(target: string, _: string) {
  if (props.devMode && target == "iddqd") {
    props.devMode.enable();
  }
}
</script>
