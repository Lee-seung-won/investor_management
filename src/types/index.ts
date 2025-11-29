export interface Investor {
  id: number;
  name: string;
  type: string;
  description?: string;
  profile_text?: string;  // AC Processor가 생성한 임베딩용 프로필 텍스트
  website?: string;
  contact?: string;
  email?: string;
  sectors: string[];
  stage: string[];
  additional_info: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  url: string;
  source?: string;
  published_at?: string;
  scraped_at: string;
  is_processed: boolean;
  processing_status: string;
  type?: string | null;  // 'investment' | 'fund' | 'otheractivity' | 'trash' | null
  additional_info: Record<string, any>;
  search_investor_id?: number;
  search_query?: string;
  collection_batch_id?: string;
  search_investor?: {
    id: number;
    name: string;
  };
}

export interface Investment {
  id: number;
  article_id: number;
  startup_id?: number;
  investor_id?: number;
  startup_name?: string;
  investor_name?: string;
  round_type?: string;
  amount?: number;
  currency: string;
  sector?: string;
  investment_date?: string;
  confidence_score: number;
  extraction_method: string;
  raw_extraction: Record<string, any>;
  is_verified: boolean;
  is_correct?: boolean;
  verified_by?: string;
  verification_notes?: string;
  verified_at?: string;
  candidate_startups?: any[];
  candidate_investors?: any[];
  created_at: string;
  updated_at: string;
  article?: {
    id: number;
    title: string;
    content?: string;
    url: string;
    source?: string;
    published_at?: string;
    scraped_at?: string;
    is_processed?: boolean;
    processing_status?: string;
  };
}

export interface Startup {
  id: number;
  name: string;
  description?: string;
  website?: string;
  sector?: string;
  stage?: string;
  founded_year?: number;
  location?: string;
  additional_info: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchQuery {
  id: number;
  query: string;
  source: string;
  results_count: number;
  status: string;
  error_message?: string;
  additional_info: Record<string, any>;
  created_at: string;
}

export interface ProcessingLog {
  id: number;
  article_id?: number;
  step: string;
  status: string;
  message?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface Stats {
  investors: number;
  articles: number;
  processed_articles: number;
  investments: number;
  verified_investments: number;
  startups: number;
}

export interface DashboardData {
  overview: {
    total_articles: number;
    processed_articles: number;
    total_investments: number;
    verified_investments: number;
    pending_verification: number;
    processing_rate: number;
    verification_rate: number;
  };
  processing_stats: {
    pending: number;
    processing: number;
    completed: number;
    error: number;
  };
  confidence_stats: {
    high: number;
    medium: number;
    low: number;
  };
  recent_articles: Article[];
  recent_investments: Investment[];
}
