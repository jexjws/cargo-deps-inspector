import { computed } from 'vue'
import { payloads } from './payload'
import { query } from './query'

export const selectedNode = computed({
  get: () => query.selected ? payloads.main.get(query.selected) : undefined,
  set: (value) => {
    query.selected = value?.packageId ?? ''
  },
})
