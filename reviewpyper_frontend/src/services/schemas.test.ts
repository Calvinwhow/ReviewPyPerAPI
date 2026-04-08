import { describe, it, expect } from 'vitest';
import {
  ScreenTitlesParams,
  OcrPdfsParams,
  EvaluateInclusionParams,
  ValidationError,
  validateOrThrow,
} from './schemas';

describe('schemas', () => {
  it('accepts a ScreenTitlesParams matching what the page sends', () => {
    const ok = validateOrThrow(ScreenTitlesParams, {
      api_key_path: '/data/p/api_key.txt',
      csv_path: '/data/p/refs.csv',
      question: 'Does X work?',
      model_choice: 'gpt-4o',
      keywords_list: ['DBS', 'OCD'],
    });
    expect((ok as { model_choice: string }).model_choice).toBe('gpt-4o');
  });

  it('rejects ScreenTitlesParams missing csv_path', () => {
    expect(() => validateOrThrow(ScreenTitlesParams, {
      api_key_path: '/k', question: 'q', model_choice: 'm',
    })).toThrow(ValidationError);
  });

  it('rejects empty api_key_path', () => {
    expect(() => validateOrThrow(ScreenTitlesParams, {
      api_key_path: '', csv_path: '/c', question: 'q', model_choice: 'm',
    })).toThrow(/api_key_path/);
  });

  it('OcrPdfsParams accepts master_list_path + page_threshold', () => {
    const ok = validateOrThrow(OcrPdfsParams, {
      master_list_path: '/data/p/master.csv',
      page_threshold: 50,
    });
    expect((ok as { page_threshold: number }).page_threshold).toBe(50);
  });

  it('OcrPdfsParams rejects negative page_threshold', () => {
    expect(() => validateOrThrow(OcrPdfsParams, {
      master_list_path: '/m', page_threshold: -1,
    })).toThrow(ValidationError);
  });

  it('EvaluateInclusionParams requires array fields', () => {
    const ok = validateOrThrow(EvaluateInclusionParams, {
      api_key_path: '/k',
      json_file_path: '/j',
      keys_to_consider: ['k1'],
      question: ['Is it relevant?'],
      model_choice: 'gpt-4o',
      master_list_path: null,
    });
    expect((ok as { keys_to_consider: string[] }).keys_to_consider).toEqual(['k1']);
  });

  it('passes through unknown extra fields', () => {
    const ok = validateOrThrow(ScreenTitlesParams, {
      api_key_path: '/k', csv_path: '/c', question: 'q', model_choice: 'm',
      unexpected: 'allowed',
    });
    expect((ok as Record<string, unknown>).unexpected).toBe('allowed');
  });
});
