import { AxiosError } from 'axios';

export function isNetworkError(error: unknown): boolean {
  return error instanceof AxiosError && !error.response;
}
