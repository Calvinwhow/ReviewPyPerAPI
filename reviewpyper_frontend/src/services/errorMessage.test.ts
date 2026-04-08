import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from './errorMessage';
import { ValidationError } from './schemas';

function makeAxiosError(detail: unknown, code?: string): AxiosError {
  const err = new AxiosError('boom', code, undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { detail },
  });
  return err;
}

describe('getErrorMessage', () => {
  it('returns ValidationError message verbatim', () => {
    const err = new ValidationError([
      { code: 'custom', path: ['csv_path'], message: 'required' } as never,
    ]);
    expect(getErrorMessage(err)).toContain('csv_path');
  });

  it('extracts string detail from axios error', () => {
    expect(getErrorMessage(makeAxiosError('File not found'))).toBe('File not found');
  });

  it('stringifies object detail from axios error', () => {
    expect(getErrorMessage(makeAxiosError({ field: 'x' }))).toContain('field');
  });

  it('returns friendly message for network errors', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(err)).toMatch(/Cannot reach the gateway/);
  });

  it('handles plain Error', () => {
    expect(getErrorMessage(new Error('plain'))).toBe('plain');
  });

  it('handles non-Error values', () => {
    expect(getErrorMessage('oops')).toBe('oops');
  });
});
