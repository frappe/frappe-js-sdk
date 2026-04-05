import { Error as FrappeError } from '../frappe_app/types';

export interface FetchClientConfig {
  baseURL: string;
  useToken?: boolean;
  token?: () => string;
  tokenType?: 'Bearer' | 'token';
  customHeaders?: object;
}

export interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export class FetchClient {
  private readonly baseURL: string;
  private readonly useToken: boolean;
  private readonly token?: () => string;
  private readonly tokenType?: 'Bearer' | 'token';
  private readonly customHeaders?: object;

  constructor(config: FetchClientConfig) {
    this.baseURL = config.baseURL;
    this.useToken = config.useToken ?? false;
    this.token = config.token;
    this.tokenType = config.tokenType;
    this.customHeaders = config.customHeaders;
  }

  private _getHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
    };

    // Update authorization token if using token auth
    if (this.useToken && this.tokenType && this.token) {
      headers.Authorization = `${this.tokenType} ${this.token()}`;
    }

    // in case of browser environments
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (window.location) {
        if (this.baseURL && this.baseURL !== window.location.origin) {
          // Do not set X-Frappe-Site-Name
        } else {
          headers['X-Frappe-Site-Name'] = window.location.hostname;
        }
      }
      // Update CSRF token on each request if available
      if (window.csrf_token && window.csrf_token !== '{{ csrf_token }}') {
        headers['X-Frappe-CSRF-Token'] = window.csrf_token;
      }
    }

    return {
      ...headers,
      ...(this.customHeaders as Record<string, string> ?? {}),
      ...(extraHeaders ?? {}),
    };
  }

  private _buildURL(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
          url.searchParams.set(key, val);
        }
      });
    }
    return url.toString();
  }

  private async _handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        ...data,
        httpStatus: response.status,
        httpStatusText: response.statusText,
        message: data.message ?? 'Request failed',
        exception: data.exception ?? data.exc_type ?? '',
      } as FrappeError;
    }

    return data as T;
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    const url = this._buildURL(path, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders(options?.headers),
      credentials: 'include',
    });
    return this._handleResponse<T>(response);
  }

  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const url = this._buildURL(path, options?.params);
    const isFormData = body instanceof FormData;
    const headers = this._getHeaders(options?.headers);

    if (isFormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: isFormData ? body : JSON.stringify(body ?? {}),
    });
    return this._handleResponse<T>(response);
  }

  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const url = this._buildURL(path, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this._getHeaders(options?.headers),
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
    return this._handleResponse<T>(response);
  }

  async delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    const url = this._buildURL(path, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this._getHeaders(options?.headers),
      credentials: 'include',
    });
    return this._handleResponse<T>(response);
  }
}

export function createFetchClient(
  appURL: string,
  useToken?: boolean,
  token?: () => string,
  tokenType?: 'Bearer' | 'token',
  customHeaders?: object
): FetchClient {
  return new FetchClient({
    baseURL: appURL,
    useToken,
    token,
    tokenType,
    customHeaders,
  });
}

export function getRequestHeaders(
  useToken: boolean = false,
  tokenType?: 'Bearer' | 'token',
  token?: () => string,
  appURL?: string,
  customHeaders?: object
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (useToken && tokenType && token) {
    headers.Authorization = `${tokenType} ${token()}`;
  }

  // in case of browser environments
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (window.location) {
      if (appURL && appURL !== window.location.origin) {
        // Do not set X-Frappe-Site-Name
      } else {
        headers['X-Frappe-Site-Name'] = window.location.hostname;
      }
    }
    if (window.csrf_token && window.csrf_token !== '{{ csrf_token }}') {
      headers['X-Frappe-CSRF-Token'] = window.csrf_token;
    }
  }

  return {
    ...headers,
    ...(customHeaders as Record<string, string> ?? {}),
  };
}
