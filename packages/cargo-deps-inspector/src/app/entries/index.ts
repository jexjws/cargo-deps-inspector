import { defineAsyncComponent } from 'vue'

export default defineAsyncComponent(() => {
  if (import.meta.env.BACKEND === 'import')
    return import('./import.vue')
  else
    return import('./dev.vue')
})
