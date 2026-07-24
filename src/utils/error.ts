import { Error as FrappeError } from '../frappe_app/types';

/**
 * Shapes any axios failure into the `Error` object the SDK throws.
 *
 * Not every failure has a server response: when the device is offline, the
 * request timed out, or the server was unreachable, axios rejects with no
 * `response` at all. The old per-call handlers read `error.response.data`
 * directly, so those failures crashed with "Cannot read properties of
 * undefined" instead of surfacing as a proper error. Here they become a
 * FrappeError with `httpStatus: 0` (the conventional "no HTTP response"
 * value) and axios's own message (e.g. "Network Error", "timeout of 5000ms
 * exceeded") so callers can still tell what happened.
 *
 * A response whose body is not an object (e.g. an HTML error page from a
 * proxy) is also handled: the status is kept, the body is not spread.
 */
export function getFrappeError(error: unknown, fallbackMessage: string): FrappeError {
  const axiosError = error as {
    response?: { data?: unknown; status: number; statusText: string };
    message?: string;
  };
  const response = axiosError?.response;

  if (!response) {
    return {
      httpStatus: 0,
      httpStatusText: '',
      message: axiosError?.message ?? fallbackMessage,
      exception: '',
    };
  }

  const data =
    typeof response.data === 'object' && response.data !== null ? (response.data as Record<string, any>) : {};

  return {
    ...data,
    httpStatus: response.status,
    httpStatusText: response.statusText,
    message: data.message ?? fallbackMessage,
    exception: data.exception ?? data.exc_type ?? '',
  };
}
