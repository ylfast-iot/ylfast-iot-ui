import type { BasicModel } from '#/api/basic';
import type {
  CertificateAuthenticationMethod,
  CertificateFormat,
  CertificateMode,
  CertificateType,
} from '#/enums/certificate';

import { buildBasicCrudApis } from '#/api/basic';
import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace IotCertificateApi {
  /**
   * 证书配置
   */
  export interface CertificateConfig {
    /**
     * PEM:私钥内容
     */
    key?: string;
    /**
     * PEM:证书内容
     */
    cert?: string;
    /**
     * PEM:信任证书,用于客户端模式
     */
    trust?: string;
    /**
     * JKS 或者 PFX 才有效: 证书库内容(base64)
     */
    keystoreBase64?: string;
    /**
     * JKS 或者 PFX 才有效: 信任库内容(base64)
     */
    trustKeyStoreBase64?: string;
    /**
     * JKS 或者 PFX 才有效: 证书密码
     */
    keystorePwd?: string;
    /**
     * JKS 或者 PFX 才有效: 信任库密码
     */
    trustKeyStorePwd?: string;
  }

  /**
   * 证书信息实体
   */
  export interface IotCertificate extends BasicModel {
    /**
     * 证书名称
     */
    name: string;
    /**
     * 认证模式：server、client
     */
    mode: CertificateMode;
    /**
     * 证书格式：PFX、JKS、PEM
     */
    format: CertificateFormat;
    /**
     * 证书类型：common（国标）
     */
    type: CertificateType;
    /**
     * 认证方式：single（单向认证）、binomial（双向认证）
     */
    authenticationMethod: CertificateAuthenticationMethod;
    /**
     * 证书配置
     */
    configuration: CertificateConfig;
    /**
     * 证书说明
     */
    description?: string;
  }

  export const BASE_URL = '/iot/certificate';

  export const Apis = {
    detail: `${BASE_URL}/{id}/detail`,
    upload: `${BASE_URL}/upload`,
  };

  export const basicCrudApis = buildBasicCrudApis<IotCertificate, string>(
    BASE_URL,
  );
}

/**
 * 查看证书信息 (解析后的文本内容)
 * @param id 证书ID
 */
export const getCertificateDetailText = (id: string) =>
  requestClient.get<string>(
    parseTemplate(IotCertificateApi.Apis.detail, { id }),
  );

/**
 * 上传证书文件并返回 Base64
 * @param file 文件对象
 */
export const uploadCertificateFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<string>(IotCertificateApi.Apis.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
