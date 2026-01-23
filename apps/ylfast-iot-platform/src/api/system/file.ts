import type { PagerResult } from '../basic';

import type { QueryParamEntity } from '#/adapter';
import type { EnumDict } from '#/types/global';

import { baseURL, requestClient } from '#/api/request';

// ==================== 原有接口（保持兼容）====================

export interface FileUploadRes {
  url: string;
  name: string;
  /**
   * 文件hash
   */
  hash: string;
}

/**
 * 文件上传 API（原有接口，保留兼容）
 */
export const uploadApi = (
  params: {
    bucketName: string;
    dir: string;
    file: Blob;
    filename?: string;
    name?: string;
  },
  onUploadProgress?: (progressEvent: any) => void,
) => {
  return requestClient.upload<FileUploadRes>(
    `/iot/file/upload/${params.bucketName}/${params.dir}`,
    params,
    {
      onUploadProgress,
      headers: {
        'Content-Type': undefined,
      },
    },
  );
};

// ==================== 类型定义 ====================

/**
 * 文件选项类型
 */
export type FileOptionType = 'publicAccess' | 'tempFile';

/**
 * 文件选项（EnumDict 类型）
 */
export type FileOptions = EnumDict<FileOptionType>[];

/**
 * 文件实体（数据库实体，不包含动态生成字段）
 */
export interface BaseFileInfo {
  /** 文件ID */
  id: string;
  /** 文件名称 */
  name: string;
  /** 文件扩展名 */
  extension: string;
  /** 文件大小（字节） */
  length: number;
  /** MD5哈希值 */
  md5: string;
  /** SHA-256哈希值 */
  sha256: string;
  /** 创建时间（毫秒时间戳） */
  createTime: number;
  /** 创建者ID */
  creatorId?: string;
  /** 文件分组桶名称 */
  bucket?: string;
  /** 文件选项 */
  options?: FileOptions;
  /** 其他配置 */
  others?: Record<string, any>;
  /** 所在服务ID */
  serverNodeId?: string;
}

/**
 * 文件实体
 */
export interface FileEntity extends BaseFileInfo {
  /** 存储路径 */
  storagePath?: string;
  /** 过期时间（毫秒时间戳） */
  expires?: number;
}

/**
 * 文件信息（包含动态生成的访问URL）
 */
export interface FileInfo extends FileEntity {
  /** 访问URL（动态生成） */
  accessUrl?: string;

  /** 相等路径 */
  path?: string;
}

/**
 * 文件上传选项
 */
export interface FileUploadOptions {
  /** 文件选项 */
  options?: FileOptions;
  /** 文件桶 */
  bucket?: string;
  /** 服务节点ID (为空则为自动节点路由) */
  serverNodeId?: string;
  /** 文件过期时间 (时间戳，毫秒) */
  expires?: number;
  /** 取消信号 */
  signal?: AbortSignal;
}

/**
 * 获取文件访问 URL 的配置选项
 */
export interface FileUrlOptions {
  /** 访问秘钥 */
  accessKey?: string;
  /** 是否作为附件下载 */
  attachment?: boolean;
  /** 缩放参数(0-100)，thumb = 50,按原比例缩放50，thumb = 800_600，缩放为800*600尺寸 */
  thumb?: string;
}

/**
 * 文件桶实体
 */
export interface FileBucketEntity {
  id: string;
  /** 桶名称 */
  name: string;
  /** 桶描述 */
  description?: string;
  /** 创建时间 */
  createTime?: number;
  /** 创建人ID */
  creatorId?: string;
}

// ==================== 桶管理 (Bucket Management) ====================

/**
 * 查询桶列表
 * POST /file/bucket/_query
 */
export async function queryFileBuckets(params: QueryParamEntity) {
  return requestClient.post<PagerResult<FileBucketEntity>>(
    '/file/bucket/_query',
    params,
  );
}

/**
 * 获取桶详情
 * GET /file/bucket/{id}
 */
export async function getFileBucket(id: string) {
  return requestClient.get<FileBucketEntity>(`/file/bucket/${id}`);
}

/**
 * 创建桶
 * POST /file/bucket
 */
export async function createFileBucket(data: Partial<FileBucketEntity>) {
  return requestClient.post<FileBucketEntity>('/file/bucket', data);
}

/**
 * 更新桶
 * PATCH /file/bucket/{id}
 */
export async function updateFileBucket(
  id: string,
  data: Partial<FileBucketEntity>,
) {
  return requestClient.put<FileBucketEntity>(`/file/bucket/${id}`, data);
}

/**
 * 删除桶
 * DELETE /file/bucket/{id}
 */
export async function deleteFileBucket(id: string) {
  return requestClient.delete(`/file/bucket/${id}`);
}

// ==================== 文件管理 (File Management) ====================

/**
 * 分页查询文件列表
 * POST /file/_query
 */
export async function queryFileList(params: QueryParamEntity) {
  return requestClient.post<PagerResult<FileEntity>>('/file/_query', params);
}

/**
 * 更新文件信息
 * PUT /file/update/{id}
 */
export async function updateFileInfo(id: string, data: Partial<FileEntity>) {
  return requestClient.put<number>(`/file/update/${id}`, data);
}

/**
 * 删除文件 (批量)
 * POST /file/batch/_delete
 */
export async function deleteFile(ids: string[]) {
  return requestClient.post<number>('/file/batch/_delete', ids);
}

// ==================== 文件上传 (File Upload) ====================

/**
 * 单文件上传（新版本）
 * POST /file/upload
 */
export async function uploadFile(
  file: File,
  options?: FileUploadOptions,
  onUploadProgress?: (progressEvent: any) => void,
) {
  const formData = { file };
  const params: Record<string, any> = {};

  if (options?.options) {
    params.options = options.options
      .map((opt: any) => opt.value || opt)
      .join(',');
  }
  if (options?.bucket) {
    params.bucket = options.bucket;
  }
  if (options?.serverNodeId) {
    params.serverNodeId = options.serverNodeId;
  }
  if (options?.expires) {
    params.expires = options.expires;
  }

  return requestClient.upload<FileInfo>('/file/upload', formData, {
    onUploadProgress,
    params,
    timeout: 20 * 60 * 1000,
    signal: options?.signal,
  });
}

/**
 * 批量上传文件
 * POST /file/batch/upload
 */
export async function uploadFiles(
  files: File[],
  options?: FileUploadOptions,
  onUploadProgress?: (progressEvent: any) => void,
) {
  // Note: 批量上传需要依次上传每个文件
  const results: FileInfo[] = [];
  for (const file of files) {
    const result = await uploadFile(file, options, onUploadProgress);
    results.push(result);
  }
  return results;
}

/**
 * 分片上传文件
 * POST /file/upload/sharding/{sessionId}
 */
export async function uploadFileSharding(
  sessionId: string,
  file: Blob | File,
  offset: number,
  length: number,
  options?: FileUploadOptions,
  onUploadProgress?: (progressEvent: any) => void,
) {
  const formData = { file };
  const params: Record<string, any> = {
    offset,
    length,
  };

  if (options?.options) {
    params.options = options.options
      .map((opt: any) => opt.value || opt)
      .join(',');
  }
  if (options?.bucket) {
    params.bucket = options.bucket;
  }
  if (options?.serverNodeId) {
    params.serverNodeId = options.serverNodeId;
  }
  if (options?.expires) {
    params.expires = options.expires;
  }

  return requestClient.upload<FileInfo>(
    `/file/upload/sharding/${sessionId}`,
    formData,
    {
      onUploadProgress,
      params,
      timeout: 20 * 60 * 1000,
      signal: options?.signal,
    },
  );
}

// ==================== 文件访问与工具 (Access & Utils) ====================

/**
 * 获取文件访问 URL
 */
export function getFileUrl(
  fileId: string,
  extension: string,
  options: FileUrlOptions = {},
): string {
  let url = `${baseURL}/file/${fileId}.${extension}`;

  const queryParams = new URLSearchParams();
  if (options.accessKey) {
    queryParams.append('accessKey', options.accessKey);
  }
  if (options.attachment) {
    queryParams.append('attachment', 'true');
  }
  if (options.thumb) {
    queryParams.append('thumb', options.thumb);
  }

  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  return url;
}

/**
 * 下载文件
 */
export function downloadFile(
  fileId: string,
  extension: string,
  fileName: string,
  accessKey?: string,
) {
  // 通过 attachment=true 强制后端返回 Content-Disposition: attachment
  const url = getFileUrl(fileId, extension, {
    attachment: true,
    accessKey,
  });
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
}
