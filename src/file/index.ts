import { FetchClient } from '../utils/fetch';

import { Error } from '../frappe_app/types';
import { FileArgs } from './types';
import { getRequestHeaders } from '../utils/fetch';

export class FrappeFileUpload {
  /** URL of the Frappe App instance */
  private readonly appURL: string;

  /** Fetch client instance */
  readonly fetch: FetchClient;

  /** Whether to use the token based auth */
  readonly useToken: boolean;

  /** Token to be used for authentication */
  readonly token?: () => string;

  /** Type of token to be used for authentication */
  readonly tokenType?: 'Bearer' | 'token';

  /** Custom Headers to be passed in request */
  readonly customHeaders?: object;

  constructor(
    appURL: string,
    fetch: FetchClient,
    useToken?: boolean,
    token?: () => string,
    tokenType?: 'Bearer' | 'token',
    customHeaders?: object
  ) {
    this.appURL = appURL;
    this.fetch = fetch;
    this.useToken = useToken ?? false;
    this.token = token;
    this.tokenType = tokenType;
    this.customHeaders = customHeaders;
  }

  /**
   * Upload file to database
   * @param {File} file to be uploaded
   * @param {@type FileArgs} args arguments of the file
   * @param {VoidFunction} onProgress file upload progress
   * @returns Promise which resolves with the file object
   */
  async uploadFile<T = any>(
    file: File,
    args: FileArgs<T>,
    onProgress?: (bytesUploaded: number, totalBytes?: number) => void,
    apiPath: string = 'upload_file'
  ) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file, file.name);
    }

    const { isPrivate, folder, file_url, doctype, docname, fieldname, otherData } = args;

    if (isPrivate) {
      formData.append('is_private', '1');
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

    const url = `${this.appURL}/api/method/${apiPath}`;
    const headers = getRequestHeaders(this.useToken, this.tokenType, this.token, this.appURL, this.customHeaders);
    delete (headers as any)['Content-Type'];

    if (onProgress) {
      return this._uploadWithProgress<T>(url, formData, headers, onProgress);
    }

    return this.fetch
      .post(`/api/method/${apiPath}`, formData)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while uploading the file.',
        } as Error;
      });
  }

  private _uploadWithProgress<T>(
    url: string,
    formData: FormData,
    headers: Record<string, string>,
    onProgress: (bytesUploaded: number, totalBytes?: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.withCredentials = true;

      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        } else {
          onProgress(event.loaded, undefined);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response as T);
          } catch {
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          let errorData: any = {};
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = {};
          }
          reject({
            ...errorData,
            httpStatus: xhr.status,
            httpStatusText: xhr.statusText,
            message: errorData.message ?? 'There was an error while uploading the file.',
            exception: errorData.exception ?? '',
          } as Error);
        }
      };

      xhr.onerror = () => {
        reject({
          httpStatus: xhr.status,
          httpStatusText: xhr.statusText,
          message: 'There was a network error while uploading the file.',
          exception: '',
        } as Error);
      };

      xhr.send(formData);
    });
  }
}
