import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  const env = process.env.REACT_APP_ENVIRONMENT || 'production';
  const customUrl = process.env.REACT_APP_API_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  // Vercel 배포 환경에서는 Railway URL을 직접 사용
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://web-production-7d32.up.railway.app';
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
  withCredentials: true,  // 쿠키 전송을 위해 필요
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
    // 401 에러인 경우 (비활성화, 세션 만료 등)
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // 세션 쿠키 삭제
      document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
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
  getInvestorUnprocessedArticleCounts: (params?: any) => 
    api.get('/api/investors/stats/unprocessed-articles', { params }),
  getInvestorFundArticleCounts: (params?: any) => 
    api.get('/api/investors/stats/fund-articles', { params }),
  getInvestorInvestmentCounts: (params?: any) => 
    api.get('/api/investors/stats/investment-counts', { params }),
  getInvestorFundCounts: (params?: any) => 
    api.get('/api/investors/stats/fund-counts', { params }),
  getInvestorOtherActivityCounts: (params?: any) => 
    api.get('/api/investors/stats/other-activity-counts', { params }),
  getInvestorOtherActivities: (investorId: number, params?: any) => 
    api.get(`/api/investors/${investorId}/other-activities`, { params }),
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
  analyzeArticle: (id: number, forceType?: string) => {
    const params = forceType ? { force_type: forceType } : {};
    return api.post(`/api/articles/${id}/analyze`, null, { params });
  },
  getFundArticles: (params?: any) => api.get('/api/articles/fund-articles', { params }),
  getCollectionAnalysis: (date: string) => {
    if (!date || typeof date !== 'string') {
      throw new Error('날짜가 필요합니다.');
    }
    return api.get('/api/articles/collection-analysis', { params: { date: date.trim() } });
  },
};

// 보고서 관련 API
export const reportsAPI = {
  getReports: (params?: any) => api.get('/api/reports/', { params }),
  getInvestorsWithReports: (params?: any) => api.get('/api/reports/investors', { params }),
  getInvestorReport: (investorId: number) => api.get(`/api/reports/investor/${investorId}`),
  getReportDetail: (reportId: number) => api.get(`/api/reports/${reportId}`),
  syncFundsFromReport: (investorId: number) => api.post(`/api/reports/investor/${investorId}/sync-funds`),
  syncAllFundsFromReports: () => api.post('/api/reports/sync-all-funds'),
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
  getFundArticles: (fundId: number) => api.get(`/api/funds/${fundId}/articles`),
  updateFund: (fundId: number, data: any) => api.put(`/api/funds/${fundId}`, data),
  deleteFund: (fundId: number) => api.delete(`/api/funds/${fundId}`),  // 펀드 자체 삭제
  unlinkFundFromArticle: (articleId: number, fundId: number) => api.delete(`/api/funds/article/${articleId}/fund/${fundId}`),  // 기사에서 펀드 연결 해제
};

// 기타 활동 관련 API
export const otherActivitiesAPI = {
  createOtherActivity: (data: any) => api.post('/api/other-activities/', data),
  getOtherActivities: (params?: any) => api.get('/api/other-activities/', { params }),
  getArticleOtherActivities: (articleId: number) => api.get(`/api/other-activities/article/${articleId}`),
  updateOtherActivity: (activityId: number, data: any) => api.put(`/api/other-activities/${activityId}`, data),
  deleteOtherActivity: (activityId: number) => api.delete(`/api/other-activities/${activityId}`),
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
  startCollection: (user_id: number | null, limit: number = 10, resume: boolean = false) => api.post('/api/collect-news', { user_id, limit, resume }),
  stopCollection: (user_id: number | null) => api.post('/api/collect-news/stop', { user_id }),
  startFundCollection: (limit_per_fund: number = 3, resume: boolean = false) => api.post('/api/collect-fund-news', { limit_per_fund, resume }),
  stopFundCollection: () => api.post('/api/collect-fund-news/stop', {}),
  getFundCollectionStatus: () => api.get('/api/collect-fund-news/status'),
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

// 사용자 인증 및 활동 로그 API
export const authAPI = {
  login: (username: string, password: string) => api.post('/api/auth/login', { username, password }, { withCredentials: true }),
  logout: () => api.post('/api/auth/logout', {}, { withCredentials: true }),
  getCurrentUser: () => api.get('/api/auth/me', { withCredentials: true }),
};

// 사용자 관리 API (어드민 전용)
export const userManagementAPI = {
  getUsers: () => api.get('/api/user-management/users', { withCredentials: true }),
  createUser: (data: { username: string; password: string; role: string }) => 
    api.post('/api/user-management/users', data, { withCredentials: true }),
  updatePassword: (userId: number, newPassword: string) => 
    api.put('/api/user-management/users/password', { user_id: userId, new_password: newPassword }, { withCredentials: true }),
  toggleUserStatus: (userId: number, isActive: boolean) => 
    api.put('/api/user-management/users/status', { user_id: userId, is_active: isActive }, { withCredentials: true }),
  updatePermissions: (userId: number, permissions: any) => 
    api.put('/api/user-management/users/permissions', { user_id: userId, permissions }, { withCredentials: true }),
};

// 블랙리스트 API
export const blacklistAPI = {
  getBlacklists: (skip?: number, limit?: number) => api.get('/api/blacklist', { params: { skip, limit } }),
  getArticleCount: (domain: string) => api.get('/api/blacklist/article-count', { params: { domain } }),
  createBlacklist: (domain: string, reason?: string, created_by?: string, delete_articles?: boolean) => 
    api.post('/api/blacklist', { domain, reason, created_by }, { params: { delete_articles: delete_articles ?? true } }),
  deleteBlacklist: (blacklistId: number) => api.delete(`/api/blacklist/${blacklistId}`),
};

// 크롤링 실패 예상 주소 API
export const crawlingFailedDomainsAPI = {
  getCrawlingFailedDomains: (skip?: number, limit?: number) => api.get('/api/crawling-failed-domains', { params: { skip, limit } }),
  deleteCrawlingFailedDomain: (domainId: number) => api.delete(`/api/crawling-failed-domains/${domainId}`),
};

// 프로필 관리 API
export const profileManagementAPI = {
  getStatus: () => api.get('/api/profile-management/status'),
  startDetection: (resume: boolean = false) => api.post('/api/profile-management/start', { resume }),
  stopDetection: () => api.post('/api/profile-management/stop', {}),
};



export default api;
