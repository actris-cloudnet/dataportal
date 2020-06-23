<style lang="sass">
  @import "../sass/variables.sass"

  .multiselect__input
    padding: 2px
    padding-left: 0px
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
  <multiselect :name="id" :id="id"
    v-model="value"
    placeholder="Select"
    track-by="id"
    label="humanReadableName"
    :options="options"
    :show-labels="false"
    :multiple="true"
    :hideSelected="false"
    @search-change="isIddqd"
  >
    <template slot="tag" slot-scope="props" v-if="icons">
      <span class="multiselect__tag">
        <img class="option__image" :src="getIconUrl(props.option.id)">
        {{ props.option.humanReadableName }}
        <i class="multiselect__tag-icon" @click="props.remove(props.option)"></i>
      </span>
    </template>
    <template slot="option" slot-scope="props" v-if="icons">
      <span>
        <img v-if="icons" class="option__image" :src="getIconUrl(props.option.id)">
        {{ props.option.humanReadableName }}
      </span>
    </template>
    <span id="noRes" slot="noResult">Not found</span>
  </multiselect>
</div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'
import {Prop, Watch} from 'vue-property-decorator'
import Multiselect from 'vue-multiselect'
import { Selection } from '../views/Search.vue'
import { DevMode } from '../lib/DevMode'

Vue.component('multiselect', Multiselect)

@Component
export default class CustomMultiselect extends Vue {
  @Prop() id!: string
  @Prop() label!: string
  @Prop() options!: Selection[]
  @Prop() icons!: boolean
  @Prop() getIconUrl!: Function
  @Prop() devMode!: DevMode
  @Prop() setSelectedIds!: Function | null
  @Prop() selectedIds!: string[]

  selection: Selection[] = []

  set value(selection) {
    this.selection = selection
    if (this.setSelectedIds) {
      this.setSelectedIds(this.selection.map(product => product.id))
    }
    this.$emit('input', this.getSelectionIds())
  }

  get value() {
    return this.selection
  }

  @Watch('selectedIds')
  onSelectedIdsChange() {
    this.selection = this.options.filter((selection: Selection) => this.selectedIds.includes(selection.id))
  }

  getSelectionIds() {
    // Return all options by default
    return this.selection.length > 0 ? this.selection.map(d => d.id) : this.options.map(d => d.id)
  }

  isIddqd(target: string, _: string) {
    if (target == 'iddqd') this.devMode.enable()
  }
}
</script>
