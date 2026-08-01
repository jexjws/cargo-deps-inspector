<script setup lang="ts">
import { getBackend } from '../../backends'
import { fetchData } from '../../state/data'
import { settings } from '../../state/settings'

const backend = getBackend()
</script>

<template>
  <div>
    <div flex="~ col gap-2" p4>
      <OptionItem title="显示源码体积" description="在 crate 卡片与图节点上显示源码目录大小">
        <OptionCheckbox v-model="settings.showSourceSizeBadge" />
      </OptionItem>
      <OptionItem title="按体积着色" description="根据源码体积调整徽章颜色">
        <OptionCheckbox v-model="settings.colorizePackageSize" />
      </OptionItem>
      <OptionItem title="依赖类型徽章" description="显示 normal、dev 与 build 来源">
        <OptionSelectGroup v-model="settings.showDependencyKindBadge" :options="['none', 'normal', 'dev', 'build', 'all']" :titles="['隐藏', 'Normal', 'Dev', 'Build', '全部']" />
      </OptionItem>
      <OptionItem title="依赖树分组" description="在详情面板中按来源或依赖类型分组">
        <OptionSelectGroup v-model="settings.dependenciesGroupBy" :options="['none', 'source', 'kind']" :titles="['不分组', '来源', '类型']" />
      </OptionItem>
      <OptionItem title="展开完整依赖树" description="显示传递依赖而不只显示直接依赖">
        <OptionCheckbox v-model="settings.deepDependenciesTree" />
      </OptionItem>
      <OptionItem title="图表动画" description="为树图、旭日图和火焰图启用过渡动画">
        <OptionCheckbox v-model="settings.chartAnimation" />
      </OptionItem>
    </div>
    <PanelFiltersOptionExcludes />
    <div v-if="backend.isDynamic" border="t base" p4>
      <button btn-action @click="fetchData(true)">
        <div i-ph-arrows-clockwise-duotone />重新解析 Cargo 数据
      </button>
    </div>
  </div>
</template>
