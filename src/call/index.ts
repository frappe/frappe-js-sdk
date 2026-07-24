import { AxiosInstance } from 'axios';

import { getFrappeError } from '../utils/error';

export class FrappeCall {
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

  constructor(
    appURL: string,
    axios: AxiosInstance,
    useToken?: boolean,
    token?: () => string,
    tokenType?: 'Bearer' | 'token',
  ) {
    this.appURL = appURL;
    this.axios = axios;
    this.useToken = useToken ?? false;
    this.token = token;
    this.tokenType = tokenType;
  }

  /** Makes a GET request to the specified endpoint */
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {

    const encodedParams = new URLSearchParams();
    // TEMP Fix Issue #50
    if (params) {
      Object.entries(params).forEach(param => {
        const [key, value] = param;
        if (value !== null && value !== undefined) {
          const val = typeof value === 'object' ? JSON.stringify(value) : value;
          encodedParams.set(key, val);
        }
      })
    }

    return this.axios
      .get(`/api/method/${path}`, {
        params: encodedParams,
      })
      .then((res) => res.data as T)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error.');
      });
  }

  /** Makes a POST request to the specified endpoint */
  async post<T = any>(path: string, params?: any): Promise<T> {
    return this.axios
      .post(`/api/method/${path}`, { ...params })
      .then((res) => res.data as T)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error.');
      });
  }

  /** Makes a PUT request to the specified endpoint */
  async put<T = any>(path: string, params?: any): Promise<T> {
    return this.axios
      .put(`/api/method/${path}`, { ...params })
      .then((res) => res.data as T)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error.');
      });
  }

  /** Makes a DELETE request to the specified endpoint */
  async delete<T = any>(path: string, params?: any): Promise<T> {
    return this.axios
      .delete(`/api/method/${path}`, { params })
      .then((res) => res.data as T)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error.');
      });
  }
}
