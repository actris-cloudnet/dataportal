<style scoped lang="sass">
  .dateform
    overflow: hidden
    white-space: nowrap

  input.date
    box-sizing: content-box
    height: 2em
    width: 7em
    font-size: 0.9em
    border: 1px solid #e8e8e8
    border-radius: 2px
</style>

<template>
  <div class="dateform" :id="name" :class="{ 'error': $v.dateString.$error }">
    <label :for="name">{{ label }}</label><br>
    <input
      class="date"
      :name="name"
      type="text"
      v-model.lazy="$v.dateString.$model"
      @focus="$event.target.select()"
    >
    <v-date-picker
      locale="en"
      v-model="value"
      :popover="{ placement: 'bottom', visibility: 'click' }"
      :input-debounce="100"
      :available-dates="{end, start}"
    >
      <button class="calendar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class="w-4 h-4 fill-current">
          <!-- eslint-disable-next-line max-len -->
          <path d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z" />
        </svg>
      </button>
    </v-date-picker>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import Vue from 'vue'
import { validationMixin } from 'vuelidate'
import { Validate } from 'vuelidate-property-decorators'
import { helpers } from 'vuelidate/lib/validators'
import { Prop, Watch } from 'vue-property-decorator'
import { dateToUTC, dateToString } from '../lib'

// date validation
const isValidDate = (obj: Date) => !isNaN(obj.getDate())
const isValidDateString = (obj: string) => isValidDate(new Date(obj))
const isNotInFuture = (obj: string) => new Date(obj) < dateToUTC(new Date())
const isBeforeEnd = (obj: string, parentVm: Vue) => new Date(obj) <= helpers.ref('end', validationMixin, parentVm)
const isAfterStart = (obj: string, parentVm: Vue) => new Date(obj) >= helpers.ref('start', validationMixin, parentVm)

@Component
export default class Datepicker extends mixins(validationMixin, Vue) {
  @Prop() name!: string
  @Prop() label!: string
  @Prop() start!: Date
  @Prop() end!: Date
  @Prop() defaultVizDate!: Date

  @Validate({ isValidDateString, isNotInFuture, isBeforeEnd, isAfterStart })
  dateString = this.$attrs.value

  dateToString = dateToString

  created() {
    // Fix displaying date string on component create
    // eslint-disable-next-line no-self-assign
    this.value = this.value
  }

  set value(date: Date) {
    if (!isValidDate(date)) return
    console.log('yay', date)
    this.dateString = this.dateToString(date)
  }

  get value(): Date {
    return new Date(this.dateString)
  }

  @Watch('defaultVizDate')
  onDefaultVizChange() {
    this.value = this.defaultVizDate
  }

  @Watch('dateString')
  onDateChange() {
    this.$emit('input', this.value)
    this.$emit('error', this.$v.dateString)
  }

}
</script>
