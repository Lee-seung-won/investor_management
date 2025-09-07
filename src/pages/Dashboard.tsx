import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message, Spin, Tag, Alert } from 'antd';
import { 
  FileTextOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { systemAPI, newsSourcesAPI } from '../services/api.ts';
import { Stats } from '../types/index';
import NewsCollectionProgress from '../components/NewsCollectionProgress.tsx';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsSourcesStatus, setNewsSourcesStatus] = useState<any>(null);
  const [testingNaver, setTestingNaver] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchNewsSourcesStatus();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await systemAPI.getStats();
      setStats(response.data);
    } catch (error) {
      message.error('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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



  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 투자사"
              value={stats?.investors || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 기사"
              value={stats?.articles || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="처리된 기사"
              value={stats?.processed_articles || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${stats?.articles || 0}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="추출된 투자 정보"
              value={stats?.investments || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="처리 현황">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="처리율"
                  value={stats ? (stats.processed_articles / stats.articles * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="검수율"
                  value={stats ? (stats.verified_investments / stats.investments * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="수동 처리"
                  value={stats?.investments || 0}
                  suffix="건"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="펀드 정보"
                  value={stats?.funds || 0}
                  suffix="건"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <NewsCollectionProgress />
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

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="시스템 정보">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {stats?.investors || 0}
                  </div>
                  <div style={{ color: '#666' }}>등록된 투자사</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {stats?.startups || 0}
                  </div>
                  <div style={{ color: '#666' }}>등록된 스타트업</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                    {stats?.verified_investments || 0}
                  </div>
                  <div style={{ color: '#666' }}>검수 완료 투자 정보</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
