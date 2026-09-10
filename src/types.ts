/**
 * types.ts - Strict TypeScript models and API contracts for VibeCart AI.
 * Aligned 1-to-1 with Pydantic v2 schemas in vibecart/schemas.py.
 */

export enum PriceVerdictEnum {
  AUTHENTIC_DEAL = "AUTHENTIC_DEAL",
  NOT_A_DEAL = "NOT_A_DEAL",
  INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE",
  POTENTIAL_PRICE_MANIPULATION = "POTENTIAL_PRICE_MANIPULATION",
}

export enum AdapterStatusEnum {
  SUCCESS = "SUCCESS",
  NOT_CONFIGURED = "NOT_CONFIGURED",
  TIMEOUT = "TIMEOUT",
  RATE_LIMITED = "RATE_LIMITED",
  ERROR = "ERROR",
}

export interface RetailerSourceStatus {
  retailer_id: string;
  retailer_name: string;
  status: AdapterStatusEnum;
  latency_ms: number;
  candidate_count: number;
  is_mock_source: boolean;
  message?: string | null;
}

export interface RetailerOffer {
  offer_id: string;
  retailer_id: string;
  retailer_name: string;
  retailer_sku: string;
  product_url: string;
  affiliate_url?: string | null;
  listed_price: number;
  advertised_mrp?: number | null;
  currency: string;
  in_stock: boolean;
  vendor_trust_score: number;
  is_mock_data: boolean;
  observed_at: string;
  evidence?: PriceEvidence | null;
  has_purchase_link?: boolean;
  competitor_source?: string | null;
}

export interface NormalizedProduct {
  canonical_id: string;
  gtin_or_barcode?: string | null;
  manufacturer_style_code?: string | null;
  brand: string;
  title: string;
  description: string;
  category: string;
  color?: string | null;
  material?: string | null;
  style_tags: string[];
  image_urls: string[];
  primary_image_url?: string | null;
  primary_offer: RetailerOffer;
  alternative_offers: RetailerOffer[];
}

export interface ProductQuerySpec {
  category: string | null;
  style_keywords: string[];
  max_budget: number | null;
  target_vendor: string | null;
  color_preferences: string[];
  material_preferences: string[];
  explicit_features: string[];
}

export interface PriceEvidence {
  historical_median_price: number | null;
  historical_average_price: number | null;
  historical_min_price: number | null;
  historical_max_price: number | null;
  observation_count: number;
  first_observed_at: string | null;
  last_observed_at: string | null;
  data_age_days: number | null;
  evidence_confidence: number;
}

export interface AuthenticatedProduct {
  product_id: string;
  vendor: string;
  title: string;
  description: string;
  category: string;
  color?: string;
  material?: string;
  style_tags?: string[];
  image_url?: string;
  listed_price: number;
  advertised_mrp: number | null;
  advertised_discount_percent: number | null;
  historical_median_price: number | null;
  actual_savings_percent: number | null;
  vibe_score: number;
  matched_features: string[];
  missing_features: string[];
  price_verdict: PriceVerdictEnum;
  price_confidence: number;
  authenticity_reason: string;
  final_composite_score: number;
  evidence?: PriceEvidence;

  // Multi-retailer offer linkage & outbound attribution
  retailer?: string;
  retailer_display?: string;
  competitor?: string;
  source_url?: string;
  product_url?: string;
  primary_offer?: RetailerOffer;
  alternative_offers?: RetailerOffer[];
  is_mock_offer?: boolean;
  has_purchase_link?: boolean;
  competitor_source?: string | null;
}

export interface ProcessingMetadata {
  correlation_id: string;
  model_used: string;
  database_candidates_found: number;
  llm_candidates_evaluated: number;
  candidates_passing_vibe_threshold: number;
  execution_time_ms: number;
  timestamp: string;
}

export interface VibeCartResponse {
  query: string;
  normalized_query: ProductQuerySpec;
  results: AuthenticatedProduct[];
  total_candidates_examined: number;
  processing_metadata: ProcessingMetadata;
  source_statuses?: RetailerSourceStatus[];
}

export interface AuthenticateRequest {
  query: string;
  image_base64?: string | null;
  strict_deal_only?: boolean;
}

export interface WatchlistCreateRequest {
  user_id: string;
  product_id: string;
  target_price?: number | null;
  notify_on_authentic_deal_only?: boolean;
}

export interface WatchlistRecord {
  user_id: string;
  product_id: string;
  target_price?: number | null;
  notify_on_authentic_deal_only: boolean;
  created_at: string;
  product_title?: string;
  product_price?: number;
  vendor?: string;
  image_url?: string;
  price_verdict?: PriceVerdictEnum;
}

export interface PriceUpdateEvent {
  event_id: string;
  product_id: string;
  vendor: string;
  new_price: number;
  advertised_mrp?: number | null;
  timestamp?: string;
}

export interface PriceUpdateResult {
  event_id: string;
  product_id: string;
  previous_price?: number | null;
  new_price: number;
  verdict: PriceVerdictEnum;
  alert_triggered: boolean;
  affected_watchlists_count: number;
  message: string;
}

export interface ServiceHealth {
  status: string;
  service: string;
  environment: string;
  model: string;
  timestamp: string;
}
