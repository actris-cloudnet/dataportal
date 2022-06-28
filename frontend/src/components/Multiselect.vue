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
    <multiselect
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
    </multiselect>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import { Prop, Watch } from "vue-property-decorator";
import Multiselect from "vue-multiselect";
import { DevMode } from "../lib/DevMode";
import { notEmpty } from "../lib";

export interface Option {
  id: string;
  humanReadableName: string;
}

type OptionId = Option["id"];

@Component({ components: { Multiselect } })
export default class CustomMultiselect extends Vue {
  @Prop() id!: string;
  @Prop() label!: string;
  @Prop() options!: Option[];
  @Prop() icons!: boolean;
  @Prop() getIcon!: Function;
  @Prop() devMode!: DevMode;
  @Prop() multiple!: boolean;
  @Prop() value!: OptionId | OptionId[] | null;

  selectedOption: Option | Option[] | null = null;

  @Watch("value")
  onValueChanged(value: OptionId | OptionId[] | null) {
    if (Array.isArray(value)) {
      this.selectedOption = value.map((v) => this.options.find((option) => option.id === v)).filter(notEmpty);
    } else {
      const result = this.options.find((option) => option.id === value);
      this.selectedOption = result !== undefined ? result : null;
    }
  }

  onInput(input: Option | Option[]) {
    this.$emit("input", Array.isArray(input) ? input.map((v) => v.id) : input.id);
  }

  isIddqd(target: string, _: string) {
    if (target == "iddqd") this.devMode.enable();
  }
}
</script>
