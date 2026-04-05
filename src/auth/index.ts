import { FetchClient } from '../utils/fetch';

import { Error } from '../frappe_app/types';
import { AuthCredentials, AuthResponse, OTPCredentials, UserPassCredentials } from './types';

export class FrappeAuth {
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

  /** Logs in the user using username and password */
  async loginWithUsernamePassword(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.fetch
      .post<{ message?: string } & AuthResponse>('/api/method/login', {
        usr: (credentials as UserPassCredentials).username,
        pwd: (credentials as UserPassCredentials).password,
        otp: (credentials as OTPCredentials).otp,
        tmp_id: (credentials as OTPCredentials).tmp_id,
        device: credentials.device,
      })
      .then((res) => res as AuthResponse)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while logging in',
        } as Error;
      });
  }

  /** Gets the currently logged in user */
  async getLoggedInUser(): Promise<string> {
    return this.fetch
      .get<{ message: string }>('/api/method/frappe.auth.get_logged_user')
      .then((res) => res.message)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while fetching the logged in user',
        } as Error;
      });
  }

  /** Logs the user out */
  async logout(): Promise<void> {
    return this.fetch
      .post('/api/method/logout', {})
      .then(() => {
        return;
      })
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while logging out',
        } as Error;
      });
  }

  /** Sends password reset email */
  async forgetPassword(user: string): Promise<void> {
    return this.fetch
      .post('/', {
        cmd: 'frappe.core.doctype.user.user.reset_password',
        user,
      })
      .then(() => {
        return;
      })
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error sending password reset email.',
        } as Error;
      });
  }
}
