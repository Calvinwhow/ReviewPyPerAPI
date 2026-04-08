import { describe, it, expect } from 'vitest';
import {
  ScreenTitlesParams,
  OcrPdfsParams,
  ValidationError,
  validateOrThrow,
} from './schemas';

describe('schemas', () => {
  it('accepts a fully populated ScreenTitlesParams', () => {
    const ok = validateOrThrow(ScreenTitlesParams, {
      csv_path: '/data/p/refs.csv',
      api_key_path: '/data/p/api_key.txt',
      research_question: 'Does X work?',
      model: 'gpt-4o',
    });
    expect(ok.model).toBe('gpt-4o');
  });

  it('rejects ScreenTitlesParams missing csv_path', () => {
    expect(() => validateOrThrow(ScreenTitlesParams, {
      api_key_path: '/k', research_question: 'q', model: 'm',
    })).toThrow(ValidationError);
  });

  it('rejects empty strings (e.g. blank api_key_path)', () => {
    expect(() => validateOrThrow(ScreenTitlesParams, {
      csv_path: '/c', api_key_path: '', research_question: 'q', model: 'm',
    })).toThrow(/api_key_path/);
  });

  it('OcrPdfsParams accepts optional page_threshold', () => {
    const ok = validateOrThrow(OcrPdfsParams, {
      pdf_dir: '/d', output_dir: '/o', page_threshold: 5,
    });
    expect(ok.page_threshold).toBe(5);
  });

  it('OcrPdfsParams rejects negative page_threshold', () => {
    expect(() => validateOrThrow(OcrPdfsParams, {
      pdf_dir: '/d', output_dir: '/o', page_threshold: -1,
    })).toThrow(ValidationError);
  });

  it('passes through extra fields', () => {
    const ok = validateOrThrow(ScreenTitlesParams, {
      csv_path: '/c', api_key_path: '/k', research_question: 'q', model: 'm',
      extra_thing: 'allowed',
    });
    expect((ok as Record<string, unknown>).extra_thing).toBe('allowed');
  });
});
