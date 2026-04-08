export interface Project {
  id: string;
  name: string;
  research_question: string;
  review_type: 'standard' | 'rapid' | 'scoping';
  created_at: string;
  llm_config?: LLMConfig;
  pipeline_state: PipelineState;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  api_key: string;
  model: string;
  model_choice: string;
}

export interface PipelineState {
  api_key_path?: string;
  csv_path?: string;
  title_output_csv_path?: string;
  abstracts_txt_path?: string;
  screened_abstract_path?: string;
  master_list_path?: string;
  pdf_csv_path?: string;
  pdf_dir?: string;
  ocr_output_dir?: string;
  preprocessed_dir?: string;
  json_dir?: string;
  inclusion_json_path?: string;
  inclusion_raw_csv_path?: string;
  inclusion_automated_csv_path?: string;
  extraction_json_path?: string;
  extraction_raw_csv_path?: string;
  extraction_automated_csv_path?: string;
}

export interface ProjectInfo { project_id: string; path: string; }
export interface FileInfo { name: string; path: string; size: number; is_dir: boolean; }
export interface UploadResponse { filename: string; path: string; }

export interface TitleScreenResponse { output_csv_path: string; }
export interface AbstractScreenResponse { screened_abstract_path: string; master_list_path: string; }
export interface PdfDownloadResponse { csv_path: string; }
export interface PdfPostProcessResponse { master_list_path: string; }
export interface PdfOcrResponse { output_dir: string; }
export interface TextPreprocessResponse { preprocessed_dir: string; }
export interface SectionLabelResponse { json_dir: string; }
export interface InclusionEvaluateResponse { evaluated_json_path: string; raw_csv_path: string; automated_csv_path: string; }
export interface ExtractionEvaluateResponse { filtered_json_path: string; evaluated_json_path: string; raw_csv_path: string; automated_csv_path: string; }
