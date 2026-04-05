import { FetchClient } from '../utils/fetch';

import { Error } from '../frappe_app/types';

export class FrappeCall {
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

  constructor(
    appURL: string,
    fetch: FetchClient,
    useToken?: boolean,
    token?: () => string,
    tokenType?: 'Bearer' | 'token',
  ) {
    this.appURL = appURL;
    this.fetch = fetch;
    this.useToken = useToken ?? false;
    this.token = token;
    this.tokenType = tokenType;
  }

  /** Makes a GET request to the specified endpoint */
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    const encodedParams: Record<string, any> = {};
    // TEMP Fix Issue #50
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          encodedParams[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        }
      });
    }

    return this.fetch
      .get<T>(`/api/method/${path}`, { params: encodedParams })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error.',
        } as Error;
      });
  }

  /** Makes a POST request to the specified endpoint */
  async post<T = any>(path: string, params?: any): Promise<T> {
    return this.fetch
      .post<T>(`/api/method/${path}`, { ...params })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error.',
        } as Error;
      });
  }

  /** Makes a PUT request to the specified endpoint */
  async put<T = any>(path: string, params?: any): Promise<T> {
    return this.fetch
      .put<T>(`/api/method/${path}`, { ...params })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error.',
        } as Error;
      });
  }

  /** Makes a DELETE request to the specified endpoint */
  async delete<T = any>(path: string, params?: any): Promise<T> {
    return this.fetch
      .delete<T>(`/api/method/${path}`, { params })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error.',
        } as Error;
      });
  }
}
