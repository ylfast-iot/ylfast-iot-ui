# Hsweb 后端框架适配器

本适配器用于将 hsweb 框架的响应格式和请求格式适配到 Vben Admin 框架中。

## 响应格式转换

### Hsweb 标准响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "result": {
    // 实际数据
  }
}
```

### Vben 标准响应格式

```json
{
  "code": 0,
  "data": {
    // 实际数据
  },
  "message": "操作成功"
}
```

## 自动适配

在 `src/api/request.ts` 中已经配置了自动适配，所有通过 `requestClient` 发送的请求都会自动转换响应格式，**无需手动处理**。

## 分页数据适配

### Hsweb 分页响应格式

```json
{
  "success": true,
  "code": 200,
  "result": {
    "data": [...],
    "pageIndex": 0,
    "pageSize": 10,
    "total": 100
  }
}
```

### VxeTable 期望的格式

```json
{
  "items": [...],
  "total": 100
}
```

## 使用示例

### 1. 普通 API 调用（自动适配）

```typescript
import { requestClient } from '#/api/request';

// 直接调用，响应会自动转换
export async function getUserList() {
  // hsweb 返回: { success: true, result: [...] }
  // 自动转换为: [...] (直接返回 data)
  return requestClient.get<User[]>('/user/list');
}
```

### 2. 分页查询（使用适配器）

```typescript
import { requestClient } from '#/api/request';
import { adaptToHswebPageParams } from '#/adapter/hsweb';

export async function getUserPage(params: {
  page: number;
  pageSize: number;
  username?: string;
}) {
  // 将 VxeTable 参数转换为 hsweb 格式
  const hswebParams = adaptToHswebPageParams(params);

  // hswebParams 格式:
  // {
  //   pageIndex: 0,  // page - 1
  //   pageSize: 10,
  //   terms: [{ column: 'username', termType: 'like', value: 'admin' }]
  // }

  return requestClient.post('/user/page', hswebParams);
}
```

### 3. 在 VxeTable 中使用

```typescript
import { useVbenVxeGrid } from '#/adapter';
import { adaptToHswebPageParams } from '#/adapter/hsweb';

const [Grid, gridApi] = useVbenVxeGrid({
  columns: [...],
  proxyConfig: {
    ajax: {
      query: async ({ page, sort, filters }) => {
        // 转换参数
        const params = adaptToHswebPageParams({
          page: page.currentPage,
          pageSize: page.pageSize,
          sort,
          ...filters,
        });

        // 调用 API
        const res = await requestClient.post('/user/page', params);

        // 响应会自动转换为 VxeTable 期望的格式
        return res;
      },
    },
  },
});
```

### 4. 自定义查询条件

```typescript
import { buildHswebTerms, buildHswebSorts } from '#/adapter/hsweb';

// 构建查询条件
const terms = buildHswebTerms(
  {
    username: 'admin',
    status: 1,
  },
  {
    username: 'like', // 模糊查询
    status: 'eq', // 精确查询
  },
);

// 构建排序
const sorts = buildHswebSorts('createTime', 'desc');

const params = {
  pageIndex: 0,
  pageSize: 10,
  terms,
  sorts,
};

const res = await requestClient.post('/user/page', params);
```

## Hsweb 查询条件类型

常用的 `termType` 值：

- `eq`: 等于
- `like`: 模糊查询
- `gt`: 大于
- `gte`: 大于等于
- `lt`: 小于
- `lte`: 小于等于
- `in`: 在...中
- `not`: 不等于
- `notin`: 不在...中
- `btw`: 在...之间
- `nbtw`: 不在...之间

## 注意事项

1. **页码差异**: Hsweb 的 `pageIndex` 从 0 开始，而前端通常从 1 开始，适配器会自动处理
2. **自动转换**: 通过 `requestClient` 的所有请求都会自动转换响应格式
3. **分页响应**: 分页数据会自动转换为 `{ items, total }` 格式供 VxeTable 使用
4. **错误处理**: 当 `success: false` 时，会自动抛出错误并显示 `message`
