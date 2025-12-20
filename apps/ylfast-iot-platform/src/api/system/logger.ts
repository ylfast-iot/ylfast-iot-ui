import type { QueryParamEntity } from '#/adapter';
import type { PagerResult } from '#/api/basic';

import { requestClient } from '#/api/request';

export namespace LoggerApi {
  export interface SystemLog {
    /**
     * ID
     */
    id: string;

    /**
     * 模块
     */
    mavenModule: string;

    /**
     * 名称
     */
    name: string;

    /**
     * 线程名
     */
    threadName: string;

    /**
     * 日志级别
     * 示例：DEBUG/INFO/WARN/ERROR/FATAL
     */
    level: string;

    /**
     * 类名
     */
    className: string;

    /**
     * 方法名
     */
    methodName: string;

    /**
     * 行号
     */
    lineNumber: number;

    /**
     * 代码地址
     */
    java: string;

    /**
     * 日志内容
     */
    message: string;

    /**
     * 异常栈
     */
    exceptionStack: string;

    /**
     * 日志时间（毫秒级时间戳）
     */
    createTime: number;

    /**
     * 线程ID
     */
    threadId: string;

    /**
     * 上下文
     */
    context: {
      [key: string]: any;
      /**
       * 服务名
       */
      server: string;
    };

    /**
     * 链路ID
     */
    traceId: string;

    /**
     * 链路跨度ID
     */
    spanId: string;
  }

  export interface AccessLog {
    /**
     * 日志ID
     */
    id: string;

    /**
     * 操作
     */
    action: string;

    /**
     * 描述
     */
    describe: string;

    /**
     * 请求方法名（Java方法名）
     */
    method: string;

    /**
     * 请求类（Java类全限定名）
     */
    target: string;

    /**
     * 请求参数（Java方法参数，非HTTP参数）
     * key: 参数名, value: 参数值
     */
    parameters: Record<string, any>;

    /**
     * 请求者IP
     */
    ip: string;

    /**
     * 请求地址（URL）
     */
    url: string;

    /**
     * HTTP请求头集合
     */
    httpHeaders: Record<string, string>;

    /**
     * 上下文
     */
    context: {
      [key: string]: any;
      /**
       * 请求ID
       */
      requestId: string;
      /**
       * 用户ID
       */
      userId: string;
      /**
       * 用户名称
       */
      userName: string;
      /**
       * 用户名
       */
      username: string;
    };

    /**
     * HTTP请求方法（GET/POST/PUT/DELETE 等）
     */
    httpMethod:
      | 'DELETE'
      | 'GET'
      | 'HEAD'
      | 'OPTIONS'
      | 'PATCH'
      | 'POST'
      | 'PUT';

    /**
     * 请求时间戳（毫秒级）
     */
    requestTime: number;

    /**
     * 响应时间戳（毫秒级）
     */
    responseTime: number;

    /**
     * 异常栈信息（请求对应方法抛出的异常）
     */
    exception: string;

    /**
     * 链路ID
     */
    traceId: string;

    /**
     * 链路跨度ID
     */
    spanId: string;

    /**
     * 绑定标识集合
     */
    bindings: Set<string>;

    /**
     * 创建者ID（请求用户ID）
     */
    creatorId: string;

    /**
     * IP地域信息（如：中国-重庆-渝中）
     */
    ipRegion: string;
  }

  export const ApiMethod = {
    systemLogs: `logger/system/_query`,
    accessLogs: `logger/access/_query`,
  };
}

/**
 * 查询系统日志 (GET)
 * @param params
 */
export const querySystemLogs = (params: QueryParamEntity) =>
  requestClient.get<PagerResult<LoggerApi.SystemLog[]>>(
    LoggerApi.ApiMethod.systemLogs,
    {
      params,
    },
  );
/**
 * 查询系统日志 (POST)
 * @param params
 */
export const querySystemLogsPost = (params: QueryParamEntity) =>
  requestClient.post<PagerResult<LoggerApi.SystemLog[]>>(
    LoggerApi.ApiMethod.systemLogs,
    params,
  );

/**
 * 查询访问日志 (GET)
 * @param params
 */
export const queryAccessLogs = (params: QueryParamEntity) =>
  requestClient.get<PagerResult<LoggerApi.AccessLog[]>>(
    LoggerApi.ApiMethod.accessLogs,
    {
      params,
    },
  );
/**
 * 查询访问日志 (POST)
 * @param params
 */
export const queryAccessLogsPost = (params: QueryParamEntity) =>
  requestClient.post<PagerResult<LoggerApi.AccessLog[]>>(
    LoggerApi.ApiMethod.accessLogs,
    params,
  );
