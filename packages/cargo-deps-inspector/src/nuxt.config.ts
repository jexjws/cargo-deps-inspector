import { rm } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Inspect from 'vite-plugin-inspect'

const NUXT_DEBUG_BUILD = !!process.env.NUXT_DEBUG_BUILD
const backend = process.env.CDI_BACKEND ?? 'dev'
const isCloudflarePagesBuild = process.env.CDI_DEPLOY_TARGET === 'cloudflare-pages'

export default defineNuxtConfig({
  ssr: false,
  spaLoadingTemplate: false,

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/eslint',
    'nuxt-eslint-auto-explicit-import',
  ],

  alias: {
    'cargo-deps-tools/browser': fileURLToPath(new URL('../../cargo-deps-tools/src/browser.ts', import.meta.url)),
    'cargo-deps-tools/utils': fileURLToPath(new URL('../../cargo-deps-tools/src/utils.ts', import.meta.url)),
    'cargo-deps-tools/constants': fileURLToPath(new URL('../../cargo-deps-tools/src/constants.ts', import.meta.url)),
    'cargo-deps-tools': fileURLToPath(new URL('../../cargo-deps-tools/src/index.ts', import.meta.url)),
    'cargo-deps-inspector': fileURLToPath(new URL('../../cargo-deps-inspector/src/node/index.ts', import.meta.url)),
  },

  logLevel: 'verbose',
  srcDir: 'app',

  eslint: {
    config: {
      standalone: false,
    },
  },

  experimental: {
    typedPages: true,
    clientNodeCompat: true,
  },

  future: {
    compatibilityVersion: 5,
  },

  features: {
    inlineStyles: false,
  },

  css: [
    '@unocss/reset/tailwind.css',
  ],

  nitro: {
    minify: NUXT_DEBUG_BUILD ? false : undefined,
    preset: 'static',
    output: {
      dir: '../dist',
    },
    routeRules: {
      '/': {
        prerender: true,
      },
      '/200.html': {
        prerender: true,
      },
      '/404.html': {
        prerender: true,
      },
      '/**': {
        prerender: false,
      },
    },
    sourcemap: false,
    ...(isCloudflarePagesBuild
      ? {
          hooks: {
            'prerender:done': async () => {
              // Cloudflare Pages enables its SPA fallback only when no top-level
              // 404.html exists. Other build targets keep Nuxt's generated 404.
              const notFoundPage = fileURLToPath(new URL('../dist/public/404.html', import.meta.url))
              await rm(notFoundPage, { force: true })
            },
          },
        }
      : {}),
  },

  app: {
    head: {
      title: 'Cargo Deps Inspector',
      charset: 'utf-8',
      viewport: 'width=device-width,initial-scale=1',
      meta: [
        { name: 'description', content: 'Visualize resolved Cargo dependencies, features, targets, sources, and more.' },
        { property: 'og:title', content: 'Cargo Deps Inspector' },
        { property: 'og:description', content: 'Visualize resolved Cargo dependencies, features, targets, sources, and more.' },
        { property: 'og:type', content: 'website' },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:title', content: 'Cargo Deps Inspector' },
        { property: 'twitter:description', content: 'Visualize resolved Cargo dependencies, features, targets, sources, and more.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `/favicon.svg` },
      ],
      htmlAttrs: {
        lang: 'zh-CN',
        class: 'bg-dots',
      },
    },
  },

  vite: {
    define: {
      'import.meta.env.BACKEND': JSON.stringify(backend),
    },
    server: {
    },
    build: {
      minify: NUXT_DEBUG_BUILD ? false : undefined,
      rollupOptions: {
        output: {
          entryFileNames: '_nuxt/[name].[hash].js',
          chunkFileNames: '_nuxt/chunks/[name].[hash].js',
        },
      },
    },
    optimizeDeps: {
      include: [
        '@antfu/utils',
        'verkit',
        'devframe/client',
      ],
      exclude: ['birpc'],
    },
    plugins: [
      NUXT_DEBUG_BUILD ? Inspect({ build: true }) as any : undefined,
    ],
  },

  devtools: {
    enabled: true,
  },

  typescript: {
    includeWorkspace: true,
  },

  hooks: {
    'prepare:types': function ({ tsConfig }) {
      const aliasesToRemoveFromAutocomplete = ['~~', '~~/*', '~', '~/*']
      for (const alias of aliasesToRemoveFromAutocomplete) {
        if (tsConfig.compilerOptions?.paths[alias]) {
          delete tsConfig.compilerOptions.paths[alias]
        }
      }
    },
  },

  compatibilityDate: '2026-05-29',
})
