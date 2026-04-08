import { z } from 'zod';

/**
 * Pipeline request schemas — kept in sync with the payloads built in the
 * page components (see frontend/src/pages/*.tsx). Validation runs in
 * useApi.ts before each POST so typos surface as a toast instead of a 422
 * from the backend.
 *
 * Optional fields use .optional() liberally; required fields are the ones
 * the page UI guards before enabling the action button.
 */

const nonEmpty = z.string().min(1, 'required');
const nullableString = z.string().nullable().optional();

export const ScreenTitlesParams = z.object({
  api_key_path: nonEmpty,
  csv_path: nonEmpty,
  question: nonEmpty,
  model_choice: nonEmpty,
  keywords_list: z.array(z.string()).optional(),
}).passthrough();

export const ScreenAbstractsParams = z.object({
  api_key_path: nonEmpty,
  title_review_path: nonEmpty,
  abstracts_txt_path: nonEmpty,
  question: nonEmpty,
  column_name: nonEmpty,
  model_choice: nonEmpty,
  keywords: z.array(z.string()).optional(),
}).passthrough();

export const DownloadPdfsParams = z.object({
  csv_path: nonEmpty,
  email: z.string().min(1),
  allow_scihub: z.boolean(),
}).passthrough();

export const PostprocessPdfsParams = z.object({
  master_list_path: nonEmpty,
  pdf_dir: nonEmpty,
}).passthrough();

export const OcrPdfsParams = z.object({
  master_list_path: nonEmpty,
  page_threshold: z.number().int().nonnegative(),
}).passthrough();

export const PreprocessTextParams = z.object({
  input_dir: nonEmpty,
}).passthrough();

export const LabelSectionsParams = z.object({
  folder_path: nonEmpty,
  article_type: nonEmpty,
  api_key_path: nullableString,
  question: nullableString,
}).passthrough();

export const EvaluateInclusionParams = z.object({
  api_key_path: nonEmpty,
  json_file_path: nonEmpty,
  keys_to_consider: z.array(z.string()),
  question: z.array(z.string()),
  model_choice: nonEmpty,
  test_mode: z.boolean().optional(),
  master_list_path: nullableString,
}).passthrough();

export const EvaluateExtractionParams = z.object({
  api_key_path: nonEmpty,
  csv_path: nonEmpty,
  json_file_path: nonEmpty,
  keys_to_consider: z.array(z.string()),
  question: z.array(z.string()),
  model_choice: nonEmpty,
  test_mode: z.boolean().optional(),
  answers_binary: z.array(z.unknown()).optional(),
  summary_type: nonEmpty,
  master_list_path: nullableString,
}).passthrough();

// --- Helpers ---

export class ValidationError extends Error {
  issues: z.ZodIssue[];
  constructor(issues: z.ZodIssue[]) {
    super(`Invalid request: ${issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error.issues);
  return result.data;
}
