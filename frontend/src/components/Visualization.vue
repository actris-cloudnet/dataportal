<template>
  <img :src="quicklookUrl + data.s3key"
       :width="data.dimensions && data.dimensions.width"
       :height="data.dimensions && data.dimensions.height"
       alt=""
       class="visualization"
       :style="style">
</template>

<script lang="ts">
import {Component, Prop, Watch} from 'vue-property-decorator'
import Vue from 'vue'
import {VisualizationItem} from '../../../backend/src/entity/VisualizationResponse'

@Component
export default class Visualization extends Vue {
  @Prop() data!: VisualizationItem
  @Prop() maxMarginLeft!: number
  @Prop() maxMarginRight!: number

  get style() {
    if (!this.data.dimensions) return {}
    const left  = this.maxMarginLeft  - this.data.dimensions.marginLeft
    const right = this.maxMarginRight - this.data.dimensions.marginRight
    const width = this.data.dimensions.width + left + right
    return {
      paddingLeft:  `${100 * left  / width}%`,
      paddingRight: `${100 * right / width}%`,
    }
  }

  quicklookUrl = `${process.env.VUE_APP_BACKENDURL}download/image/`
}
</script>
