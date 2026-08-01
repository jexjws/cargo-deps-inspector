<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    number: number | string
    color?: string
    icon?: string
    prefix?: string
    suffix?: string
    format?: 'locale' | 'percent'
  }>(),
  {
    color: 'badge-color-gray op75',
    format: 'locale',
  },
)
const { locale } = useI18n()

const formatted = computed(() => {
  if (props.format === 'percent') {
    return Number(props.number).toLocaleString(locale.value, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return Number(props.number).toLocaleString(locale.value)
})
</script>

<template>
  <div :class="color" class="px-0.4em py-0.2em font-mono line-height-none flex items-center">
    <div v-if="icon" :class="icon" class="mr-1" />
    {{ prefix || '' }}{{ formatted }}{{ suffix || '' }}
    <slot name="after" />
  </div>
</template>
