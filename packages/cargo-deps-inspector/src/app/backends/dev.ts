import type { ConnectionMeta } from 'devframe/types'
import type { Backend } from '../types/backend'
import { connectDevframe } from 'devframe/client'
import { ref, shallowRef } from 'vue'
import { useRuntimeConfig } from '#app/nuxt'

export async function createDevBackend(): Promise<Backend> {
  const config = useRuntimeConfig()
  const rawBase = config.app.baseURL || './'
  const baseURL = typeof window !== 'undefined'
    ? new URL(rawBase, window.location.origin).href
    : rawBase

  let connectionMeta: ConnectionMeta | undefined
  if (import.meta.env.DEV) {
    try {
      connectionMeta = await fetch(`${baseURL}api/metadata.json`).then(response => response.json()) as ConnectionMeta
    }
    catch {
      // Static discovery remains available when the development metadata route is absent.
    }
  }

  const status: Backend['status'] = ref('connecting')
  const connectionError = shallowRef<unknown>()
  const client = await connectDevframe({ baseURL, connectionMeta })
  const inspector = client.scope('cargo-deps-inspector')
  const websocket = client.connectionMeta.backend === 'websocket'
  status.value = 'connected'

  async function query<T>(name: string, ...args: unknown[]): Promise<T> {
    try {
      return await inspector.rpc.call(name, ...args) as T
    }
    catch (error) {
      connectionError.value = error
      throw error
    }
  }

  return {
    name: websocket ? 'dev' : 'static',
    status,
    connectionError,
    isDynamic: websocket,
    connect() {},
    functions: {
      getPayload: force => query('get-payload', force),
      getAudit: websocket ? force => query('report-audit', { force }) : undefined,
      getOutdated: websocket ? force => query('report-outdated', { force }) : undefined,
      openInEditor: websocket
        ? filename => void inspector.rpc.callEvent('open-in-editor', filename)
        : undefined,
      openInFinder: websocket
        ? filename => void inspector.rpc.callEvent('open-in-finder', filename)
        : undefined,
    },
  }
}
