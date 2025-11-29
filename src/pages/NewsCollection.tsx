import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, message, Spin, Tag, Alert, Space, Typography, Descriptions, DatePicker, Collapse, List } from 'antd';
import { 
  FileTextOutlined, 
  ApiOutlined,
  BankOutlined
} from '@ant-design/icons';
import { newsSourcesAPI, articlesAPI } from '../services/api.ts';
import NewsCollectionProgress from '../components/NewsCollectionProgress.tsx';
import FundNewsCollectionProgress from '../components/FundNewsCollectionProgress.tsx';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;
const { Panel } = Collapse;

const NewsCollection: React.FC = () => {
  const [newsSourcesStatus, setNewsSourcesStatus] = useState<any>(null);
  const [testingNaver, setTestingNaver] = useState(false);
  const [analysisDate, setAnalysisDate] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    fetchNewsSourcesStatus();
  }, []);

  const fetchNewsSourcesStatus = async () => {
    try {
      const response = await newsSourcesAPI.getStatus();
      setNewsSourcesStatus(response.data);
    } catch (error) {
      console.error('뉴스 소스 상태 조회 실패:', error);
    }
  };

  const testNaverAPI = async () => {
    try {
      setTestingNaver(true);
      const response = await newsSourcesAPI.testNaverAPI();
      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.error || '네이버 API 테스트 실패');
      }
    } catch (error) {
      message.error('네이버 API 테스트 중 오류가 발생했습니다.');
    } finally {
      setTestingNaver(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisDate) {
      message.warning('날짜를 선택해주세요.');
      return;
    }
    
    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(analysisDate)) {
      message.error('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.');
      return;
    }
    
    try {
      setAnalysisLoading(true);
      console.log('분석 요청 날짜:', analysisDate);
      const response = await articlesAPI.getCollectionAnalysis(analysisDate);
      
      // 응답 데이터 검증
      if (!response || !response.data) {
        throw new Error('응답 데이터가 없습니다.');
      }
      
      const data = response.data;
      
      // 응답 데이터 구조 검증 및 정리
      if (typeof data !== 'object' || data === null) {
        throw new Error('잘못된 응답 형식입니다.');
      }
      
      // 안전한 데이터 구조로 변환
      const safeData = {
        date: typeof data.date === 'string' ? data.date : String(data.date || ''),
        total_articles: typeof data.total_articles === 'number' ? data.total_articles : 0,
        total_investors: typeof data.total_investors === 'number' ? data.total_investors : 0,
        investors: Array.isArray(data.investors) ? data.investors.map((inv: any) => ({
          investor_id: typeof inv.investor_id === 'number' ? inv.investor_id : 0,
          investor_name: typeof inv.investor_name === 'string' ? inv.investor_name : String(inv.investor_name || ''),
          article_count: typeof inv.article_count === 'number' ? inv.article_count : (Array.isArray(inv.articles) ? inv.articles.length : 0),
          articles: Array.isArray(inv.articles) ? inv.articles.map((art: any) => ({
            id: typeof art.id === 'number' ? art.id : 0,
            title: typeof art.title === 'string' ? art.title : String(art.title || '제목 없음'),
            url: typeof art.url === 'string' ? art.url : String(art.url || '#'),
            source: typeof art.source === 'string' ? art.source : String(art.source || '-'),
            published_at: art.published_at ? String(art.published_at) : null,
            scraped_at: art.scraped_at ? String(art.scraped_at) : null,
            search_query: typeof art.search_query === 'string' ? art.search_query : (art.search_query ? String(art.search_query) : null),
            collection_batch_id: typeof art.collection_batch_id === 'string' ? art.collection_batch_id : (art.collection_batch_id ? String(art.collection_batch_id) : null)
          })) : []
        })) : []
      };
      
      setAnalysisData(safeData);
      message.success('분석이 완료되었습니다.');
    } catch (error: any) {
      console.error('수집 기사 분석 실패:', error);
      console.error('에러 응답:', error.response?.data);
      let errorMessage = '분석 중 오류가 발생했습니다.';
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 422) {
          // FastAPI validation error
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((e: any) => {
              if (typeof e === 'string') return e;
              if (typeof e === 'object' && e.msg) {
                return `${e.loc?.join('.') || ''}: ${e.msg}`;
              }
              return JSON.stringify(e);
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            errorMessage = errorData.detail.msg || JSON.stringify(errorData.detail);
          } else {
            errorMessage = '요청 파라미터가 올바르지 않습니다. 날짜를 확인해주세요.';
          }
        } else if (status === 400) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : '잘못된 요청입니다.';
        } else {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : `서버 오류 (${status})`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      setAnalysisData(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <NewsCollectionProgress />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <FundNewsCollectionProgress />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="뉴스 소스 상태" extra={<ApiOutlined />}>
            {newsSourcesStatus && (
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={newsSourcesStatus.naver_news_api?.enabled ? 'green' : 'red'}>
                        {newsSourcesStatus.naver_news_api?.enabled ? '활성' : '비활성'}
                      </Tag>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>네이버 뉴스 API</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {newsSourcesStatus.naver_news_api?.daily_limit?.toLocaleString()}회/일
                    </div>
                    <Button
                      size="small"
                      type="link"
                      loading={testingNaver}
                      onClick={testNaverAPI}
                      style={{ marginTop: 4 }}
                    >
                      테스트
                    </Button>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={newsSourcesStatus.newsapi?.enabled ? 'green' : 'red'}>
                        {newsSourcesStatus.newsapi?.enabled ? '활성' : '비활성'}
                      </Tag>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>NewsAPI</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {newsSourcesStatus.newsapi?.daily_limit?.toLocaleString()}회/일
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="orange">웹 스크래핑</Tag>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>TechCrunch</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      백업 소스
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="orange">웹 스크래핑</Tag>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>VentureBeat</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      백업 소스
                    </div>
                  </div>
                </Col>
              </Row>
            )}
            {!newsSourcesStatus?.naver_news_api?.enabled && (
              <Alert
                message="네이버 뉴스 API 설정 필요"
                description="더 안정적인 뉴스 수집을 위해 네이버 뉴스 API 키를 설정해주세요."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>날짜별 수집 기사 분석</span>
              </Space>
            }
          >
            <Space style={{ marginBottom: 16, width: '100%' }}>
              <DatePicker
                placeholder="분석할 날짜를 선택하세요"
                format="YYYY-MM-DD"
                onChange={(date: Dayjs | null) => {
                  setAnalysisDate(date ? date.format('YYYY-MM-DD') : null);
                }}
                style={{ width: 200 }}
                allowClear
              />
              <Button 
                type="primary" 
                onClick={handleAnalyze}
                loading={analysisLoading}
                disabled={!analysisDate}
              >
                분석하기
              </Button>
            </Space>

            {analysisData && (
              <div style={{ marginTop: 24 }}>
                <Descriptions bordered column={3} size="small" style={{ marginBottom: 24 }}>
                  <Descriptions.Item label="분석 날짜">
                    {typeof analysisData.date === 'string' ? analysisData.date : String(analysisData.date || '')}
                  </Descriptions.Item>
                  <Descriptions.Item label="총 수집 기사 수">
                    {typeof analysisData.total_articles === 'number' ? analysisData.total_articles : 0}개
                  </Descriptions.Item>
                  <Descriptions.Item label="투자사 수">
                    {typeof analysisData.total_investors === 'number' ? analysisData.total_investors : 0}개
                  </Descriptions.Item>
                </Descriptions>

                {analysisData.investors && Array.isArray(analysisData.investors) && analysisData.investors.length > 0 ? (
                  <Collapse>
                    {analysisData.investors.map((investor: any, idx: number) => (
                      <Panel
                        key={investor.investor_id || idx}
                        header={
                          <Space>
                            <BankOutlined />
                            <Text strong>{String(investor.investor_name || '')}</Text>
                            <Tag color="blue">ID: {investor.investor_id}</Tag>
                          </Space>
                        }
                      >
                        <List
                          dataSource={Array.isArray(investor.articles) ? investor.articles : []}
                          renderItem={(article: any) => (
                            <List.Item
                              style={{
                                padding: '12px',
                                border: '1px solid #f0f0f0',
                                borderRadius: '4px',
                                marginBottom: '8px'
                              }}
                            >
                              <List.Item.Meta
                                title={
                                  <a 
                                    href={String(article.url || '#')} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '14px', fontWeight: 'bold' }}
                                  >
                                    {String(article.title || '제목 없음')}
                                  </a>
                                }
                                description={
                                  <Space split={<span style={{ color: '#d9d9d9' }}>|</span>} style={{ marginTop: 8 }}>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                      출처: {article.source || '-'}
                                    </span>
                                    {article.published_at && (
                                      <span style={{ fontSize: '12px', color: '#666' }}>
                                        발행일: {(() => {
                                          try {
                                            return new Date(article.published_at).toLocaleDateString('ko-KR');
                                          } catch {
                                            return article.published_at;
                                          }
                                        })()}
                                      </span>
                                    )}
                                    {article.scraped_at && (
                                      <span style={{ fontSize: '12px', color: '#666' }}>
                                        수집일: {(() => {
                                          try {
                                            return new Date(article.scraped_at).toLocaleString('ko-KR');
                                          } catch {
                                            return article.scraped_at;
                                          }
                                        })()}
                                      </span>
                                    )}
                                    {article.search_query && (
                                      <Tag color="purple" style={{ fontSize: '11px' }}>
                                        쿼리: {article.search_query}
                                      </Tag>
                                    )}
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Panel>
                    ))}
                  </Collapse>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    해당 날짜에 수집된 기사가 없습니다.
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewsCollection;

