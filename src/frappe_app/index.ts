import { FetchClient, createFetchClient } from '../utils/fetch';
import { FrappeAuth } from '..';
import { FrappeCall } from '../call';
import { FrappeDB } from '../db';
import { FrappeFileUpload } from '../file';
import { TokenParams } from './types';

export class FrappeApp {
  /** URL of the Frappe instance */
  readonly url: string;

  /** Name of the Frappe App instance */
  readonly name: string;

  /** Fetch client instance */
  readonly fetch: FetchClient;

  /** Whether to use token based auth */
  readonly useToken: boolean;

  /** Function that returns the token to be used for authentication */
  readonly token?: () => string;

  /** Type of token to be used for authentication */
  readonly tokenType?: 'Bearer' | 'token';

  /** Custom Headers to be passed in each request */
  readonly customHeaders?: object;

  constructor(url: string, tokenParams?: TokenParams, name?: string, customHeaders?: object) {
    this.url = url;
    this.name = name ?? 'FrappeApp';
    this.useToken = tokenParams?.useToken ?? false;
    this.token = tokenParams?.token;
    this.tokenType = tokenParams?.type ?? 'Bearer';
    this.customHeaders = customHeaders;
    this.fetch = createFetchClient(this.url, this.useToken, this.token, this.tokenType, this.customHeaders);
  }

  /** Returns a FrappeAuth object for the app */
  auth() {
    return new FrappeAuth(this.url, this.fetch, this.useToken, this.token, this.tokenType);
  }

  /** Returns a FrappeDB object for the app */
  db() {
    return new FrappeDB(this.url, this.fetch, this.useToken, this.token, this.tokenType);
  }

  /** Returns a FrappeFileUpload object for the app */
  file() {
    return new FrappeFileUpload(this.url, this.fetch, this.useToken, this.token, this.tokenType, this.customHeaders);
  }

  /** Returns a FrappeCall object for the app */
  call() {
    return new FrappeCall(this.url, this.fetch, this.useToken, this.token, this.tokenType);
  }
}
