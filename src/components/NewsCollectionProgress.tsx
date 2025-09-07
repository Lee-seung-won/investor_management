import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, message, Space, Typography, Row, Col, Statistic, Spin } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { newsCollectionAPI } from '../services/api.ts';

const { Text } = Typography;

interface CollectionStatus {
  is_running: boolean;
  progress: number;
  total_investors: number;
  processed_investors: number;
  collected_articles: number;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
  last_collection_date: string | null;
  current_investor_index: number;
  can_resume: boolean;
}

const NewsCollectionProgress: React.FC = () => {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await newsCollectionAPI.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('수집 상태 조회 실패:', error);
    }
  };

  const startCollection = async (resume: boolean = false) => {
    try {
      setCollecting(true);
      const response = await newsCollectionAPI.startCollection(20, resume);
      
      if (response.data.status === 'running') {
        message.warning('뉴스 수집이 이미 진행 중입니다.');
      } else if (response.data.status === 'already_collected_today') {
        message.warning(response.data.message);
      } else {
        message.success(response.data.message);
        setPolling(true);
      }
    } catch (error) {
      message.error('뉴스 수집 시작에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  };

  const stopCollection = async () => {
    try {
      const response = await newsCollectionAPI.stopCollection();
      message.success(response.data.message);
      setPolling(false);
    } catch (error) {
      message.error('뉴스 수집 중단에 실패했습니다.');
    }
  };

  const stopMonitoring = () => {
    setPolling(false);
    message.info('수집 상태 모니터링을 중지했습니다.');
  };

  const refreshStatus = async () => {
    setLoading(true);
    try {
      await fetchStatus();
    } catch (error) {
      console.error('상태 새로고침 실패:', error);
      message.error('상태 새로고침에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (polling && status?.is_running) {
      interval = setInterval(fetchStatus, 2000); // 2초마다 상태 업데이트
    } else if (status?.is_running === false) {
      setPolling(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, status?.is_running]);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleString('ko-KR');
  };

  const getStatusColor = () => {
    if (status?.error_message) return '#ff4d4f';
    if (status?.is_running) return '#1890ff';
    if (status?.progress === 100) return '#52c41a';
    return '#d9d9d9';
  };

  const getStatusIcon = () => {
    if (status?.error_message) return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    if (status?.is_running) return <Spin size="small" />;
    if (status?.progress === 100) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    return <StopOutlined />;
  };

  const getStatusText = () => {
    if (status?.error_message) return '오류 발생';
    if (status?.is_running) return '수집 중';
    if (status?.progress === 100) return '수집 완료';
    return '대기 중';
  };

  return (
    <Card 
      title={
        <Space>
          {getStatusIcon()}
          <span>뉴스 수집 상태</span>
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshStatus}
            loading={loading}
          >
            새로고침
          </Button>
          <Space>
            {!status?.is_running ? (
              <>
                {/* 재개 가능한 경우: 재개 버튼만 표시 */}
                {status?.can_resume ? (
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => startCollection(true)}
                    loading={collecting}
                  >
                    수집 재개
                  </Button>
                ) : (
                  /* 재개 불가능한 경우: 오늘 수집하지 않았으면 시작 버튼 표시 */
                  !status?.last_collection_date && (
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={() => startCollection(false)}
                      loading={collecting}
                    >
                      수집 시작
                    </Button>
                  )
                )}
              </>
            ) : (
              <Button 
                danger
                icon={<StopOutlined />}
                onClick={stopCollection}
              >
                수집 중단
              </Button>
            )}
            {status?.is_running && (
              <Button 
                icon={<StopOutlined />}
                onClick={stopMonitoring}
              >
                모니터링 중지
              </Button>
            )}
          </Space>
        </Space>
      }
    >
      {status && (
        <>
          {/* 진행률 바 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong>수집 진행률</Text>
              <Text strong style={{ color: getStatusColor() }}>
                {status.progress}%
              </Text>
            </div>
            <Progress 
              percent={status.progress} 
              strokeColor={getStatusColor()}
              showInfo={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <Text type="secondary">
                {status.processed_investors} / {status.total_investors} 투자사 처리
              </Text>
              <Text type="secondary">
                {status.collected_articles}개 기사 수집
              </Text>
            </div>
          </div>

          {/* 통계 정보 */}
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="처리된 투자사"
                value={status.processed_investors}
                suffix={`/ ${status.total_investors}`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="수집된 기사"
                value={status.collected_articles}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="상태"
                value={getStatusText()}
                valueStyle={{ color: getStatusColor() }}
              />
            </Col>
          </Row>

          {/* 시간 정보 */}
          {(status.start_time || status.end_time) && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
              <Row gutter={16}>
                {status.start_time && (
                  <Col span={12}>
                    <Text type="secondary">시작 시간: </Text>
                    <Text>{formatTime(status.start_time)}</Text>
                  </Col>
                )}
                {status.end_time && (
                  <Col span={12}>
                    <Text type="secondary">완료 시간: </Text>
                    <Text>{formatTime(status.end_time)}</Text>
                  </Col>
                )}
              </Row>
            </div>
          )}

          {/* 오류 메시지 */}
          {status.error_message && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fff2f0', 
              border: '1px solid #ffccc7',
              borderRadius: '6px' 
            }}>
              <Text type="danger">
                <ExclamationCircleOutlined /> 오류: {status.error_message}
              </Text>
            </div>
          )}

          {/* 하루 한번 제한 메시지 */}
          {status.last_collection_date && !status.is_running && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fff7e6', 
              border: '1px solid #ffd591',
              borderRadius: '6px' 
            }}>
              <Text style={{ color: '#fa8c16' }}>
                마지막 수집일: {status.last_collection_date} (하루에 한번만 수집 가능)
              </Text>
            </div>
          )}

          {/* 완료 메시지 */}
          {status.progress === 100 && !status.is_running && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '6px' 
            }}>
              <Text style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> 뉴스 수집이 완료되었습니다!
              </Text>
            </div>
          )}

          {/* 재개 가능 메시지 */}
          {status.can_resume && !status.is_running && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '6px' 
            }}>
              <Text style={{ color: '#1890ff' }}>
                이전 수집이 중단되었습니다. "수집 재개" 버튼을 눌러 이어서 진행할 수 있습니다.
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default NewsCollectionProgress;
