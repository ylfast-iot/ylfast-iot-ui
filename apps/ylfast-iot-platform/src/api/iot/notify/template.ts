import type { QueryParamEntity, Recordable } from '#/adapter';
import type { BasicModel } from '#/api/basic';
import type { ConfigMetadata } from '#/types/config-metadata';
import type { DataTypeDef } from '#/types/data-type';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotNotifyTemplateApi {
  /**
   * 通知变量定义
   */
  export interface VarDef {
    id: string;
    name: string;
    required: boolean;
    defaultValue?: any;
    type: DataTypeDef;
    format?: string;
    description?: string;
    expands?: Recordable;
  }

  /**
   * 通知模版详情 (简要信息含变量定义)
   */
  export interface TemplateInfo {
    id: string;
    name: string;
    varDefs: VarDef[];
  }

  export interface NotifyTemplate extends BasicModel {
    /** 服务提供商 */
    provider: string;
    /** 通知类型 */
    type: string;
    /** 模板名称 */
    name: string;
    /** 模板配置 (Map) */
    template: Recordable;
    /** 模板变量定义 */
    varDefs: VarDef[];
    /** 通知配置ID */
    configId: string;
    /** 通知模板描述 */
    description?: string;
  }

  const BASE_URL = '/iot/notifier/template';
  export const Apis = {
    queryByConfig: `${BASE_URL}/{configId}/_query`,
    queryDetailByConfig: `${BASE_URL}/{configId}/detail/_query`,
    detail: `${BASE_URL}/{templateId}/detail`,
    metadata: `${BASE_URL}/{type}/{provider}/config/metadata`,
  };

  // 基础 CRUD 接口
  export const basicCrudApis = buildBasicCrudApis<NotifyTemplate, string>(
    BASE_URL,
  );

  /**
   * 钉钉/微信企业 部门信息
   */
  export interface CorpDepartment {
    id: string;
    name: string;
    parentId?: string;
    children?: CorpDepartment[];
    [key: string]: any;
  }

  /**
   * 钉钉/微信企业 用户信息
   */
  export interface CorpUser {
    id: string;
    name: string;
    department?: string[];
    [key: string]: any;
  }

  /**
   * 微信企业标签
   */
  export interface CorpTag {
    id: string;
    name: string;
  }

  /**
   * 阿里云短信签名
   */
  export interface AliyunSmsSign {
    signName: string;
    [key: string]: any;
  }

  /**
   * 阿里云短信模板
   */
  export interface AliyunSmsTemplate {
    templateCode: string;
    templateName: string;
    templateContent: string;
    templateType: string;
    auditStatus: string;
  }
}

/**
 * 根据配置ID查询通知模版列表
 * @param configId 通知配置ID
 * @param query 查询参数
 */
export const queryTemplatesByConfigId = (
  configId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<IotNotifyTemplateApi.NotifyTemplate[]>(
    parseTemplate(IotNotifyTemplateApi.Apis.queryByConfig, { configId }),
    query,
  );

/**
 * 根据配置ID查询通知模版详情列表 (含完整变量定义（数据库动态+静态变量）)
 * @param configId 通知配置ID
 * @param query 查询参数
 */
export const queryTemplatesDetailByConfigId = (
  configId: string,
  query: QueryParamEntity,
) =>
  requestClient.post<IotNotifyTemplateApi.NotifyTemplate[]>(
    parseTemplate(IotNotifyTemplateApi.Apis.queryDetailByConfig, { configId }),
    query,
  );

/**
 * 获取模版详情信息 (含完整变量定义（数据库动态+静态变量）)
 * @param templateId 模版ID
 */
export const getTemplateDetail = (templateId: string) =>
  requestClient.get<IotNotifyTemplateApi.TemplateInfo>(
    parseTemplate(IotNotifyTemplateApi.Apis.detail, { templateId }),
  );

/**
 * 获取指定类型和服务商所需模版配置定义
 * @param type 通知类型ID
 * @param provider 服务商ID
 */
export const getTemplateConfigMetadata = (type: string, provider: string) =>
  requestClient.get<ConfigMetadata>(
    parseTemplate(IotNotifyTemplateApi.Apis.metadata, { type, provider }),
  );

/**
 * =============================================================================
 * 钉钉企业消息相关接口
 * =============================================================================
 */

const DINGTALK_BASE_URL = '/iot/notifier/dingtalk/corp';

/**
 * 获取钉钉企业部门信息
 */
export const getDingTalkDepartments = (configId: string, fetchChild = false) =>
  requestClient.get<IotNotifyTemplateApi.CorpDepartment[]>(
    `${DINGTALK_BASE_URL}/${configId}/departments`,
    { params: { fetchChild } },
  );

/**
 * 获取钉钉企业部门信息 (树结构)
 */
export const getDingTalkDepartmentsTree = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.CorpDepartment[]>(
    `${DINGTALK_BASE_URL}/${configId}/departments/tree`,
  );

/**
 * 获取钉钉企业部门下人员信息
 */
export const getDingTalkDepartmentUsers = (
  configId: string,
  departmentId: string,
) =>
  requestClient.get<IotNotifyTemplateApi.CorpUser[]>(
    `${DINGTALK_BASE_URL}/${configId}/${departmentId}/users`,
  );

/**
 * 获取钉钉企业全部人员信息
 */
export const getDingTalkAllUsers = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.CorpUser[]>(
    `${DINGTALK_BASE_URL}/${configId}/users`,
  );

/**
 * 生成钉钉企业用户Oauth2绑定授权url
 * @param configId 配置ID
 * @param redirectUri 重定向地址 (后端 Java 代码中 QueryParam 键名为 authCode)
 */
export const getDingTalkUserBindingUrl = (
  configId: string,
  redirectUri: string,
) =>
  requestClient.get<string>(
    `${DINGTALK_BASE_URL}/${configId}/oauth2/binding-user-url`,
    {
      params: { authCode: redirectUri },
    },
  );

/**
 * 获取钉钉oauth2授权的用户绑定码
 */
export const getDingTalkOauth2UserBindCode = (
  configId: string,
  authCode: string,
) =>
  requestClient.get<string>(`${DINGTALK_BASE_URL}/oauth2/user-bind-code`, {
    params: { configId, authCode },
  });

/**
 * =============================================================================
 * 微信企业消息相关接口
 * =============================================================================
 */

const WECHAT_BASE_URL = '/notifier/wechat/corp';

/**
 * 获取微信企业标签列表
 */
export const getWeChatTags = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.CorpTag[]>(
    `${WECHAT_BASE_URL}/${configId}/tags`,
  );

/**
 * 获取微信企业部门列表
 */
export const getWeChatDepartments = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.CorpDepartment[]>(
    `${WECHAT_BASE_URL}/${configId}/departments`,
  );

/**
 * 获取微信企业部门下成员列表
 */
export const getWeChatDepartmentUsers = (
  configId: string,
  departmentId: string,
) =>
  requestClient.get<IotNotifyTemplateApi.CorpUser[]>(
    `${WECHAT_BASE_URL}/${configId}/${departmentId}/users`,
  );

/**
 * 获取微信企业全部成员列表
 */
export const getWeChatAllUsers = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.CorpUser[]>(
    `${WECHAT_BASE_URL}/${configId}/users`,
  );

/**
 * 生成微信企业用户Oauth2绑定授权url
 */
export const getWeChatUserBindingUrl = (
  configId: string,
  templateId: string,
  redirectUri: string,
) =>
  requestClient.get<string>(
    `${WECHAT_BASE_URL}/${configId}/${templateId}/oauth2/binding-user-url`,
    { params: { redirectUri } },
  );

/**
 * 获取微信oauth2授权的用户绑定码
 */
export const getWeChatOauth2UserBindCode = (
  configId: string,
  authCode: string,
) =>
  requestClient.get<string>(`${WECHAT_BASE_URL}/oauth2/user-bind-code`, {
    params: { configId, authCode },
  });

/**
 * =============================================================================
 * 阿里云短信相关接口
 * =============================================================================
 */

const SMS_ALIYUN_BASE_URL = '/iot/notifier/sms/aliyun';

/**
 * 获取阿里云短信标签列表
 */
export const getAliyunSmsSigns = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.AliyunSmsSign[]>(
    `${SMS_ALIYUN_BASE_URL}/${configId}/signs`,
  );

/**
 * 获取阿里云短信模板列表
 */
export const getAliyunSmsTemplates = (configId: string) =>
  requestClient.get<IotNotifyTemplateApi.AliyunSmsTemplate[]>(
    `${SMS_ALIYUN_BASE_URL}/${configId}/templates`,
  );
