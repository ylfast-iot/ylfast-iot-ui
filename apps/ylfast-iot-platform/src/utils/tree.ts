interface TreeHelperConfig {
  id: string;
  children: string;
  pid: string;
}

const DEFAULT_CONFIG: TreeHelperConfig = {
  id: 'id',
  children: 'children',
  pid: 'pid',
};

/**
 * 将列表转换为树形结构
 * @param list 列表数据
 * @param config 配置项
 */
export function listToTree<T = any>(
  list: any[],
  config: Partial<TreeHelperConfig> = {},
): T[] {
  const conf = { ...DEFAULT_CONFIG, ...config };
  const nodeMap = new Map();
  const tree: T[] = [];
  const listCopy = list.map((item) => ({ ...item })); // Create a shallow copy to avoid mutating original list items excessively if reused, though we modify children

  for (const node of listCopy) {
    node[conf.children] = node[conf.children] || [];
    nodeMap.set(node[conf.id], node);
  }

  for (const node of listCopy) {
    const parent = nodeMap.get(node[conf.pid]);
    if (parent) {
      parent[conf.children].push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
}
