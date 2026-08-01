# cargo-deps-tools

Cargo Deps Inspector 的 TypeScript 核心库，负责：

- 执行 `cargo metadata --format-version=1`；
- 按 Cargo package ID 建立依赖与反向依赖图；
- 保留 normal/dev/build、target、feature、source 和声明版本范围；
- 计算传递依赖、深度与来源分类；
- 统计本地 crate 源码目录体积。

```ts
import { listPackageDependencies } from 'cargo-deps-tools'

const result = await listPackageDependencies({
  cwd: process.cwd(),
  locked: true,
  allFeatures: true,
})

console.log(result.packages)
```

浏览器端解析已生成的 Cargo metadata 时，使用 `cargo-deps-tools/browser`；该入口不会引入 Node 文件系统或进程执行代码。
