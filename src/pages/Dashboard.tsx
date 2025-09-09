import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message, Spin, Tag, Alert, Table, Typography, Space, Tooltip } from 'antd';
import { 
  FileTextOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined,
  ApiOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { systemAPI, newsSourcesAPI, authAPI } from '../services/api.ts';
import { Stats } from '../types/index';
import NewsCollectionProgress from '../components/NewsCollectionProgress.tsx';
import ActivityLogModal from '../components/ActivityLogModal.tsx';
import { useUser } from '../contexts/UserContext';

const { Text, Title } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsSourcesStatus, setNewsSourcesStatus] = useState<any>(null);
  const [testingNaver, setTestingNaver] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchNewsSourcesStatus();
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    }
  }, [user]);

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

  const fetchActivityLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await authAPI.getActivityLogs(undefined, 3); // 최근 3개 로그만
      setActivityLogs(response.data.logs || []);
    } catch (error) {
      console.error('활동 로그 조회 실패:', error);
      message.error('활동 로그를 불러오는데 실패했습니다.');
    } finally {
      setLogsLoading(false);
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
        <Col span={12}>
          <Card title="처리 현황">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="처리율"
                  value={stats ? (stats.processed_articles / stats.articles * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="검수율"
                  value={stats ? (stats.verified_investments / stats.investments * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="수동 처리"
                  value={stats?.investments || 0}
                  suffix="건"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
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
        <Col span={12}>
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <HistoryOutlined />
                <span>최근 활동 로그</span>
                <Button 
                  size="small" 
                  onClick={fetchActivityLogs}
                  loading={logsLoading}
                >
                  새로고침
                </Button>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={() => setLogModalVisible(true)}
                size="small"
              >
                자세히 보기
              </Button>
            }
          >
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {logsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                </div>
              ) : activityLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  활동 로그가 없습니다.
                </div>
              ) : (
                activityLogs.map((log, index) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < activityLogs.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      backgroundColor: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {log.user_name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {log.action === '로그인' ? (
                        // 로그인 로그는 간단하게 표시
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {(() => {
                              const koreanDate = new Date(log.created_at);
                              koreanDate.setHours(koreanDate.getHours() + 9);
                              return koreanDate.toLocaleString('ko-KR');
                            })()}
                          </Text>
                          <Text style={{ color: '#666', fontSize: '12px' }}>
                            {log.user_name}님이 로그인했습니다.
                          </Text>
                        </div>
                      ) : (
                        // 다른 로그들은 기존대로 상세하게 표시
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Text strong style={{ color: '#1890ff' }}>{log.user_name}</Text>
                            <Tag 
                              color={
                                log.action === '사용자생성' ? 'blue' :
                                log.action === '뉴스수집시작' ? 'orange' :
                                log.action === '뉴스수집중단' ? 'red' :
                                log.action === '뉴스수집재개' ? 'cyan' :
                                log.action === '투자정보등록' ? 'purple' :
                                log.action === '펀드정보등록' ? 'magenta' :
                                log.action === '라벨링' ? 'gold' : 'default'
                              }
                              size="small"
                            >
                              {log.action}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {(() => {
                                const koreanDate = new Date(log.created_at);
                                koreanDate.setHours(koreanDate.getHours() + 9);
                                return koreanDate.toLocaleString('ko-KR');
                              })()}
                            </Text>
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {(() => {
                              const details = log.details || {};
                              if (log.action === '투자정보등록') {
                                return `"${details.startup_name || '스타트업'}" 기사(ID: ${details.article_id || 'N/A'})에서 투자정보를 입력하였습니다.`;
                              } else if (log.action === '펀드정보등록') {
                                return `"${details.fund_name || '펀드'}" 기사(ID: ${details.article_id || 'N/A'})에서 펀드정보를 입력하였습니다.`;
                              } else if (log.action === '라벨링') {
                                return `기사(ID: ${details.article_id || 'N/A'})에서 ${details.token_count || 0}개의 토큰을 라벨링하였습니다.`;
                              } else if (log.action === '뉴스수집시작') {
                                return `뉴스 수집을 시작하였습니다. (제한: ${details.limit || 'N/A'}개)`;
                              } else if (log.action === '뉴스수집중단') {
                                return '뉴스 수집을 중단하였습니다.';
                              } else if (log.action === '뉴스수집재개') {
                                return '뉴스 수집을 재개하였습니다.';
                              } else if (log.action === '사용자생성') {
                                return `새로운 사용자 "${details.user_name || 'N/A'}"가 생성되었습니다.`;
                              } else {
                                return '시스템 활동을 수행하였습니다.';
                              }
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
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

      <ActivityLogModal 
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
      />
    </div>
  );
};

export default Dashboard;
