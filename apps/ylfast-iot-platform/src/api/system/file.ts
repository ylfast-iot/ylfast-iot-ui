import { requestClient } from '#/api/request';

export interface FileUploadRes {
  url: string;
  name: string;
  /**
   * 文件hash
   */
  hash: string;
}

/**
 * 文件上传 API
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
    },
  );
};
