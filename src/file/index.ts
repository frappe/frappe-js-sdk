import { AxiosInstance, AxiosProgressEvent } from 'axios';

import { Error } from '../frappe_app/types';
import { FileArgs } from './types';
import { getRequestHeaders } from '../utils/axios';

export class FrappeFileUpload {
  /** URL of the Frappe App instance */
  private readonly appURL: string;

  /** Axios instance */
  readonly axios: AxiosInstance;

  /** Whether to use the token based auth */
  readonly useToken: boolean;

  /** Token to be used for authentication */
  readonly token?: () => string;

  /** Type of token to be used for authentication */
  readonly tokenType?: 'Bearer' | 'token';

  /** Custom Headers to be passed in request */
  readonly customHeaders?: object

  constructor(
    appURL: string,
    axios: AxiosInstance,
    useToken?: boolean,
    token?: () => string,
    tokenType?: 'Bearer' | 'token',
    customHeaders?: object
  ) {
    this.appURL = appURL;
    this.axios = axios;
    this.useToken = useToken ?? false;
    this.token = token;
    this.tokenType = tokenType;
    this.customHeaders = customHeaders
  }

  /**
   * Upload file to database
   * @param {File} file to be uploaded
   * @param {@type FileArgs} args arguments of the file
   * @param {VoidFunction} onProgress file upload progress
   * @returns Promise which resolves with the file object
   */
  async uploadFile<T = any>(file: File, args: FileArgs<T>, onProgress?: (bytesUploaded: number, totalBytes?: number, progress?: AxiosProgressEvent) => void, apiPath: string = 'upload_file') {
    const formData = new FormData();
    if (file) formData.append('file', file, file.name);

    const { isPrivate, folder, file_url, doctype, docname, fieldname, otherData } = args;

    if (isPrivate !== undefined) {
      formData.append('is_private', isPrivate ? '1' : '0');
    }
    if (folder) {
      formData.append('folder', folder);
    }
    if (file_url) {
      formData.append('file_url', file_url);
    }
    if (doctype && docname) {
      formData.append('doctype', doctype);
      formData.append('docname', docname);
      if (fieldname) {
        formData.append('fieldname', fieldname);
      }
    }

    if (otherData) {
      Object.keys(otherData).forEach((key: string) => {
        const v = otherData[key as keyof T] as any;
        formData.append(key, v);
      });
    }

    return this.axios
      .post(`/api/method/${apiPath}`, formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            onProgress(progressEvent.loaded, progressEvent.total, progressEvent);
          }
        },
        headers: {
          ...getRequestHeaders(this.useToken, this.tokenType, this.token, this.appURL, this.customHeaders),
          'Content-Type': 'multipart/form-data',
        }
      })
      .catch((error) => {
        throw {
          ...error.response.data,
          httpStatus: error.response.status,
          httpStatusText: error.response.statusText,
          message: error.response.data.message ?? 'There was an error while uploading the file.',
          exception: error.response.data.exception ?? '',
        } as Error;
      });
  }
}
