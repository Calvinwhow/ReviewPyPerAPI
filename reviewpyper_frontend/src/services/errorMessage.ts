import axios from 'axios';
import { ValidationError } from './schemas';

/** Best-effort human-readable message for any error thrown in the app. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ValidationError) return err.message;
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail) return JSON.stringify(detail);
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the gateway. Is it running?';
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
