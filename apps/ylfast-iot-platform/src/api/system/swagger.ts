import { requestClient } from '#/api/request';

export namespace SwaggerApi {
  export interface SwaggerUrl {
    /** 接口文档地址 */
    url: string;
    /** 接口文档名称 */
    name: string;
  }

  export interface SwaggerConfig {
    /** 配置地址 */
    configUrl: string;
    /** OAuth2 登录回调地址 */
    oauth2RedirectUrl: string;
    /** 接口资源列表 */
    urls: SwaggerUrl[];
    /** 验证器地址 */
    validatorUrl: string;
  }

  type Server = {
    description: string;
    url: string;
  };

  type Type = 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
  type Method =
    | 'connect'
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'patch'
    | 'post'
    | 'put'
    | 'trace';

  type ContentType =
    | 'application/json'
    | 'application/octet-stream'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data';

  type Parameter = {
    description?: string;
    in: 'cookie' | 'header' | 'path' | 'query';
    name: string;
    required?: boolean;
    schema: {
      [key: string]: any;
      type: Type;
      'x-type': string;
    };
  };

  /**
   * OpenAPI JSON 文档根节点
   */
  export interface SwaggerDocs {
    /** OpenAPI 版本号 */
    openapi: string;
    /** 基本信息 */
    info: {
      title: string;
      version: string;
    };
    /** 服务端地址配置 */
    servers?: Server[];
    /** API 路径及其操作定义 */
    paths: {
      [key: string]: {
        [key in Method]?: {
          [key: string]: any;
          description?: string;
          operationId: string;
          parameters?: Parameter[];
          requestBody?: {
            content?: {
              [key in ContentType]?: {
                schema: {
                  $ref?: string;
                  [key: string]: any;
                };
              };
            };
          };
          responses?: {
            [string: string]: {
              content?: {
                [string: string]: {
                  schema: {
                    $ref?: string;
                    [key: string]: any;
                  };
                };
              };
              description: string;
            };
          };
          security?: {
            // key =  权限id
            // value = ['action']
            [key: string]: string[];
          }[];
          summary?: string;
          tags: string[];
        };
      };
    };
    /** 组件配置 (包含 schema 等) */
    components?: {
      schemas: {
        [key: string]: {
          [key: string]: any;
          properties: {
            [key: string]: {
              $ref?: string;
              [key: string]: any;
              description?: string;
              type: Type;
              'x-type': string;
            };
          };
          required?: string[];
          type: Type;
          'x-type': string;
        };
      };
    };
    /** 内部拓展内容 */
    [key: string]: any;
  }

  export const BASE_URL = '/v3/api-docs';

  export const Apis = {
    config: `${BASE_URL}/swagger-config`,
  };
}

// === Exported Interface Functions ===

/**
 * 获取 Swagger 基础配置 (包含支持的可用分组及模块地址)
 * @returns Swagger 配置信息
 */
export const querySwaggerConfig = () => {
  return requestClient.get<SwaggerApi.SwaggerConfig>(SwaggerApi.Apis.config, {
    // 标记不要按照业务约定的 { code: 0, data: ... } 解构原始报错，因为 swagger 本身直接返回 JSON 对象
    responseReturn: 'body',
  });
};

/**
 * 根据具体的 url 获取 OpenAPI 标准规范描述的 JSON 文档对象
 * @param url 从 config.urls 中获取到的具体 API 数据路径
 * @returns Swagger OpenAPI 文档 JSON 对象
 */
export const querySwaggerDocs = (url: string) => {
  return requestClient.get<SwaggerApi.SwaggerDocs>(url, {
    responseReturn: 'body',
  });
};
