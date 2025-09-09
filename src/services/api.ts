import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  const env = process.env.REACT_APP_ENVIRONMENT || 'production';
  const customUrl = process.env.REACT_APP_API_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  switch (env) {
    case 'local':
      return 'http://localhost:8000';
    case 'production':
    default:
      return 'https://web-production-7d32.up.railway.app';
  }
};

const API_BASE_URL = getApiBaseUrl();

// 환경 정보 로깅
console.log(`🌐 API Base URL: ${API_BASE_URL}`);
console.log(`🔧 Environment: ${process.env.REACT_APP_ENVIRONMENT || 'production'}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // 타임아웃을 30초로 증가
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 투자사 관련 API
export const investorsAPI = {
  getInvestors: (params?: any) => api.get('/api/investors/', { params }),
  getInvestor: (id: number) => api.get(`/api/investors/${id}`),
  getInvestorInvestments: (id: number, params?: any) => 
    api.get(`/api/investors/${id}/investments`, { params }),
  getInvestorArticles: (id: number, params?: any) => 
    api.get(`/api/investors/${id}/articles`, { params }),
  getInvestorInvestmentHistory: (id: number, params?: any) => 
    api.get(`/api/investors/${id}/investment-history`, { params }),
  getInvestorFundHistory: (id: number, params?: any) => 
    api.get(`/api/investors/${id}/fund-history`, { params }),
  getSectorStats: () => api.get('/api/investors/stats/sectors'),
  getArticleCounts: () => api.get('/api/investors/stats/articles'),
  updateInvestor: (id: number, data: any) => api.put(`/api/investors/${id}`, data),
};

// 기사 관련 API
export const articlesAPI = {
  getArticles: (params?: any) => api.get('/api/articles/', { params }),
  getArticle: (id: number) => api.get(`/api/articles/${id}`),
  getArticleInvestments: (id: number) => api.get(`/api/articles/${id}/investments`),
  scrapeArticleContent: (id: number) => api.post(`/api/articles/${id}/scrape-content`),
  getProcessingStats: () => api.get('/api/articles/stats/processing'),
  markArticleProcessed: (id: number) => api.post(`/api/articles/${id}/mark-processed`),
  getSourceStats: () => api.get('/api/articles/stats/sources'),
  updateArticleContent: (id: number, content: string) => api.put(`/api/articles/${id}/content`, { content }),
};

// 투자 정보 관련 API
export const investmentsAPI = {
  getInvestments: (params?: any) => api.get('/api/investments/', { params }),
  getInvestment: (id: number) => api.get(`/api/investments/${id}`),
  createInvestment: (data: any) => api.post('/api/investments/', data),
  updateInvestment: (id: number, data: any) => api.put(`/api/investments/${id}`, data),
  deleteInvestment: (id: number) => api.delete(`/api/investments/${id}`),
  verifyInvestment: (id: number, data: any) => api.put(`/api/investments/${id}/verify`, data),
  getArticleInvestments: (id: number) => api.get(`/api/articles/${id}/investments`),
  getRoundStats: () => api.get('/api/investments/stats/rounds'),
  getConfidenceStats: () => api.get('/api/investments/stats/confidence'),
  getMonthlyTrends: (params?: any) => api.get('/api/investments/trends/monthly', { params }),
};

// 관리자 관련 API
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getPendingInvestments: (params?: any) => api.get('/api/admin/investments/pending', { params }),
  getErrorInvestments: (params?: any) => api.get('/api/admin/investments/errors', { params }),
  getProcessingErrors: (params?: any) => api.get('/api/admin/articles/processing-errors', { params }),
  reprocessInvestment: (id: number) => api.post(`/api/admin/investments/${id}/reprocess`),
  getProcessingLogs: (params?: any) => api.get('/api/admin/logs/processing', { params }),
  systemCleanup: (params?: any) => api.post('/api/admin/system/cleanup', null, { params }),
};

// 시스템 관련 API
export const systemAPI = {
  getStats: () => api.get('/api/stats'),
  collectNews: (params?: any) => api.post('/api/collect-news', null, { params }),
};

// 펀드 관련 API
export const fundsAPI = {
  createFund: (data: any) => api.post('/api/funds/', data),
  getFunds: (params?: any) => api.get('/api/funds/', { params }),
  getArticleFunds: (articleId: number) => api.get(`/api/funds/article/${articleId}`),
  updateFund: (fundId: number, data: any) => api.put(`/api/funds/${fundId}`, data),
  deleteFund: (fundId: number) => api.delete(`/api/funds/${fundId}`),
};

// 라벨링 관련 API
export const labelingAPI = {
  getArticles: (params?: any) => api.get('/api/labeling/articles', { params }),
  getArticleTokens: (articleId: number) => api.get(`/api/labeling/articles/${articleId}/tokens`),
  createLabelingData: (data: any) => api.post('/api/labeling/data', data),
  createLabelingDataBatch: (data: any) => api.post('/api/labeling/data/batch', data),
  getStats: () => api.get('/api/labeling/stats'),
  deleteLabelingData: (articleId: number) => api.delete(`/api/labeling/data/${articleId}`),
  exportCSV: () => api.get('/api/labeling/export/csv', { responseType: 'blob' }),
};

// 뉴스 수집 관련 API
export const newsCollectionAPI = {
  getStatus: () => api.get('/api/collect-news/status'),
  startCollection: (limit: number = 10, resume: boolean = false) => api.post('/api/collect-news', { limit, resume }),
  stopCollection: () => api.post('/api/collect-news/stop'),
};

// 뉴스 소스 관련 API
export const newsSourcesAPI = {
  getStatus: () => api.get('/api/news-sources/status'),
  testNaverAPI: () => api.post('/api/news-sources/test/naver'),
};

// 데이터 품질 관리 API
export const dataQualityAPI = {
  getStats: () => api.get('/api/data-quality/stats'),
  getDuplicates: (threshold?: number, limit?: number) => api.get('/api/data-quality/duplicates', { params: { threshold, limit } }),
  getStandardizationIssues: (fieldType?: string, limit?: number) => api.get('/api/data-quality/standardization-issues', { params: { field_type: fieldType, limit } }),
  fixDuplicates: (duplicateGroups: any) => api.post('/api/data-quality/fix-duplicates', duplicateGroups),
  standardizeData: (fieldType: string, rules: any) => api.post('/api/data-quality/standardize-data', { field_type: fieldType, standardization_rules: rules }),
  getQualityTrends: (days?: number) => api.get('/api/data-quality/quality-trends', { params: { days } }),
};

// 매칭 알고리즘 API
export const matchingAPI = {
  matchInvestors: (data: any) => api.post('/api/matching/match', data),
  getAvailableSectors: () => api.get('/api/matching/sectors'),
  testAPI: () => api.get('/api/matching/test'),
};


export default api;
