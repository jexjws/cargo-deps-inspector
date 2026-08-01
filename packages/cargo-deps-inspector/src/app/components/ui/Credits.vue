<template>
  <div flex="~ gap-1.1 items-center" p3 pl5 pr4 text-hex-222a dark:text-hex-888e>
    基于
    <a href="https://nuxt.com" target="_blank" rel="noopener" flex="~ gap-1.1 items-center">
      <div i-logos-nuxt-icon text-0.6rem mr--0.6 />
      <span text-hex-01dc82>Nuxt</span>
    </a>
    构建，数据来自
    <a href="https://doc.rust-lang.org/cargo/commands/cargo-metadata.html" target="_blank" rel="noopener" hover="underline">cargo metadata</a>
    <div flex-auto />
    <a href="https://github.com/jexjws/cargo-deps-inspector" target="_blank" rel="noopener" op-fade hover:op100>
      <div i-ri-github-fill text-lg />
    </a>
  </div>
</template>
