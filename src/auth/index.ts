import { AxiosInstance } from 'axios';

import { getFrappeError } from '../utils/error';
import { AuthCredentials, AuthResponse, OTPCredentials, UserPassCredentials } from './types';

export class FrappeAuth {
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

  /** Logs in the user using username and password */
  async loginWithUsernamePassword(credentials: AuthCredentials): Promise<AuthResponse> {

    return this.axios
      .post('/api/method/login', {
        usr: (credentials as UserPassCredentials).username,
        pwd: (credentials as UserPassCredentials).password,
        otp: (credentials as OTPCredentials).otp,
        tmp_id: (credentials as OTPCredentials).tmp_id,
        device: credentials.device,
      })
      .then((res) => res.data as AuthResponse)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error while logging in');
      });
  }

  /** Gets the currently logged in user */
  async getLoggedInUser(): Promise<string> {
    return this.axios
      .get('/api/method/frappe.auth.get_logged_user')
      .then((res) => res.data.message)
      .catch((error) => {
        throw getFrappeError(error, 'There was an error while fetching the logged in user');
      });
  }

  /** Logs the user out */
  async logout(): Promise<void> {
    return this.axios
      .post('/api/method/logout', {})
      .then(() => {
        return;
      })
      .catch((error) => {
        throw getFrappeError(error, 'There was an error while logging out');
      });
  }

  /** Sends password reset email */
  async forgetPassword(user: string): Promise<void> {
    return this.axios
      .post('/', {
        cmd: 'frappe.core.doctype.user.user.reset_password',
        user,
      })
      .then(() => {
        return;
      })
      .catch((error) => {
        throw getFrappeError(error, 'There was an error sending password reset email.');
      });
  }
}
