import { z } from 'zod';

// --- Pipeline request schemas ---
// Validate params before POSTing so typos surface immediately.

const nonEmpty = z.string().min(1, 'required');

export const ScreenTitlesParams = z.object({
  csv_path: nonEmpty,
  api_key_path: nonEmpty,
  research_question: nonEmpty,
  model: nonEmpty,
  review_type: z.enum(['standard', 'rapid', 'scoping']).optional(),
  article_type: z.string().optional(),
}).passthrough();

export const ScreenAbstractsParams = z.object({
  csv_path: nonEmpty,
  api_key_path: nonEmpty,
  research_question: nonEmpty,
  model: nonEmpty,
}).passthrough();

export const DownloadPdfsParams = z.object({
  csv_path: nonEmpty,
  output_dir: nonEmpty,
}).passthrough();

export const PostprocessPdfsParams = z.object({
  master_list_path: nonEmpty,
  pdf_dir: nonEmpty,
}).passthrough();

export const OcrPdfsParams = z.object({
  pdf_dir: nonEmpty,
  output_dir: nonEmpty,
  page_threshold: z.number().int().nonnegative().optional(),
}).passthrough();

export const PreprocessTextParams = z.object({
  input_dir: nonEmpty,
  output_dir: nonEmpty,
}).passthrough();

export const LabelSectionsParams = z.object({
  input_dir: nonEmpty,
  output_dir: nonEmpty,
  api_key_path: nonEmpty,
  model: nonEmpty,
}).passthrough();

export const EvaluateInclusionParams = z.object({
  json_dir: nonEmpty,
  api_key_path: nonEmpty,
  research_question: nonEmpty,
  model: nonEmpty,
}).passthrough();

export const EvaluateExtractionParams = z.object({
  json_dir: nonEmpty,
  api_key_path: nonEmpty,
  research_question: nonEmpty,
  model: nonEmpty,
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
