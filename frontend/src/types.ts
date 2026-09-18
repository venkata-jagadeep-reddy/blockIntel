export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type IntegrityStatus = "MATCH" | "MISMATCH" | "NOT_REGISTERED";
export type ExtractionMethod = "NATIVE" | "OCR" | "IMAGE_OCR" | string;

export interface FontInfo {
  name: string;
  type?: string;
  page?: number;
  encoding?: string;
  sizes?: number[];
}

export interface ImageObject {
  xref: number;
  page: number;
  width: number;
  height: number;
  colorspace: string;
  extension: string;
}

export interface HeadingItem {
  text: string;
  size: number;
  font?: string;
  page: number;
}

export interface PageDimension {
  page: number;
  width: number;
  height: number;
}

export interface StructuralInfo {
  page_count?: number;
  total_text_blocks?: number;
  total_images?: number;
  total_drawings?: number;
  fonts?: FontInfo[];
  headings?: HeadingItem[];
  embedded_images?: ImageObject[];
  page_dimensions?: PageDimension[];
  [key: string]: any;
}

export interface MetadataDto {
  author?: string | null;
  producer?: string | null;
  creator?: string | null;
  creation_date?: string | null;
  modification_date?: string | null;
  raw_metadata?: Record<string, any>;
  structural_info?: StructuralInfo;
}

export interface BlockchainRegistration {
  credential_id?: string;
  algorithm?: string;
  artifact_hash?: string;
  registered: boolean;
  contract_address?: string | null;
  transaction_hash?: string | null;
  block_number?: number | null;
  network_id?: string | null;
  registered_at?: string | null;
}

export interface RiskSignal {
  signal_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  description: string;
  signal_metadata?: Record<string, any>;
}

export interface SkillEvidence {
  text: string;
  page_number: number;
  confidence_weight: number;
}

export interface Skill {
  canonical_skill: string;
  detected_term: string;
  category?: string;
  evidence: SkillEvidence;
  competency_score: number;
  confidence_score: number;
  competency_reasons: string[];
  confidence_reasons: string[];
}

export interface CredentialSummary {
  id?: string;
  credential_id: string;
  original_filename: string;
  file_type: string;
  mime_type?: string;
  file_size_bytes: number;
  sha256_hash: string;
  status: string;
  created_at: string;
}

export interface DocumentProcessing {
  credential_id?: string;
  extraction_method: ExtractionMethod;
  text_available: boolean;
  total_pages: number;
  average_ocr_confidence?: number | null;
  extracted_text_preview: string;
  extracted_at?: string;
  status?: string;
  full_text?: string | null;
}

export interface AuthenticityRisk {
  credential_id?: string;
  risk_score: number;
  risk_level: RiskLevel;
  signals: RiskSignal[];
  explanations: string[];
}

export interface Integrity {
  algorithm: string;
  hash: string;
  blockchain_registered: boolean;
  integrity_status: IntegrityStatus;
}

export interface IntelligenceResult {
  credential: CredentialSummary;
  document_processing: DocumentProcessing;
  authenticity_risk: AuthenticityRisk;
  integrity: Integrity;
  skills: Skill[];
  metadata?: MetadataDto | null;
  blockchain_registration?: BlockchainRegistration | null;
}

export interface CredentialListItem {
  id: string;
  credential_id: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface IntegrityVerificationResponse {
  credential_id: string;
  submitted_hash: string;
  registered_hash?: string | null;
  hash_match: boolean;
  integrity_status: IntegrityStatus;
  message: string;
  verified_at: string;
}

export interface UniversalVerificationResponse {
  is_present: boolean;
  verdict: "ORIGINAL" | "TAMPERED" | "NOT_PRESENT";
  is_tampered: boolean;
  is_original: boolean;
  submitted_filename: string;
  submitted_hash: string;
  submitted_size_bytes: number;
  matched_credential_id?: string | null;
  matched_filename?: string | null;
  registered_hash?: string | null;
  match_confidence: number;
  match_reason: string;
  diff_indicators: string[];
  blockchain_registered: boolean;
  contract_address?: string | null;
  transaction_hash?: string | null;
  block_number?: number | null;
  network_id?: string | null;
  registered_at?: string | null;
  verified_at: string;
}

export interface AuthUser {
  username: string;
  email?: string | null;
  role: string;
  name: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
