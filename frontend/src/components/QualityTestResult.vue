<template>
  <ul>
    <li v-for="test in qualityTestResult" :key="test.name">
      {{ test.name }}
      <ul>
        <li v-if="test.report.length === 0">All pass</li>
        <li v-else v-for="report in test.report" :key="report" class="circled">
          <span v-if="typeof report == 'string'">{{ report }}</span>
          <ul v-else class="report">
            <li v-for="key in Object.keys(report)" :key="key">
              {{ key }}: {{ report[key] }}
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {QualityResponse} from '../views/QualityReport.vue'

@Component
export default class QualityTestResult extends Vue {
  @Prop() qualityTestResult!: QualityResponse
}
</script>
