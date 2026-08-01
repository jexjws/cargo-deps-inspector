import type { PackageNode } from 'cargo-deps-tools'
import type { TreeNode } from 'nanovis'

export type ChartNode = TreeNode<PackageNode | undefined>
