/**
 * Hsweb 后端框架适配器
 * 用于适配 hsweb 框架的响应格式和请求格式
 */

// 认证适配器
export { adaptToPermissionCode, type Authentication } from './auth';

// 菜单适配器
export { adaptHswebMenu, type HswebMenu } from './menu';

// 请求参数
export * from './QueryParams';
// 请求适配器
export {
  adaptToHswebPageParams,
  buildHswebSorts,
  buildHswebTerms,
} from './request';

// 响应适配器
export {
  adaptHswebPageResponse,
  adaptHswebResponse,
  extractHswebData,
  extractHswebPageData,
  isHswebSuccess,
} from './response';

// 类型定义
export type {
  HswebPageParams,
  HswebPageResponse,
  HswebQueryParams,
  HswebResponse,
} from './types';

// 用户信息适配器
export { adaptUserInfo, type UserDetail } from './user';
