import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, message, Space, Typography, Row, Col, Statistic, Spin } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, LockOutlined } from '@ant-design/icons';
import { dataMartAPI } from '../services/api';
import { usePermissions } from '../utils/permissions';

const { Text } = Typography;

interface CollectionStatus {
  is_running: boolean;
  current_investor_id: number | null;
  current_investor_name: string | null;
  total_investors: number;
  processed_investors: number;
  progress: number;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
  can_resume: boolean;
}

const DataMartCollectionProgress: React.FC = () => {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [polling, setPolling] = useState(false);
  const { hasPermission } = usePermissions();

  const fetchStatus = async () => {
    try {
      const response = await dataMartAPI.getCollectionStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('상태 조회 실패:', error);
    }
  };

  const startCollection = async (resume: boolean = false) => {
    if (!hasPermission('collect_data_mart')) {
      message.error('데이터 마트 수집 권한이 없습니다.');
      return;
    }
    
    try {
      setCollecting(true);
      const response = await dataMartAPI.startCollection(resume);
      
      if (response.data.status === 'running') {
        message.warning('데이터 마트 수집이 이미 진행 중입니다.');
      } else {
        message.success(response.data.message);
        setPolling(true);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('데이터 마트 수집 권한이 없습니다.');
      } else {
        message.error('데이터 마트 수집 시작에 실패했습니다.');
      }
    } finally {
      setCollecting(false);
    }
  };

  const stopCollection = async () => {
    if (!hasPermission('collect_data_mart')) {
      message.error('데이터 마트 수집 권한이 없습니다.');
      return;
    }
    
    try {
      const response = await dataMartAPI.stopCollection();
      message.success(response.data.message);
      setPolling(false);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('데이터 마트 수집 권한이 없습니다.');
      } else {
        message.error('데이터 마트 수집 중단에 실패했습니다.');
      }
    }
  };

  const stopMonitoring = () => {
    setPolling(false);
    message.info('모니터링을 중지했습니다.');
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
          <span>데이터 마트 수집기</span>
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
                {status?.can_resume ? (
                  <Button 
                    type="primary" 
                    icon={hasPermission('collect_data_mart') ? <PlayCircleOutlined /> : <LockOutlined />}
                    onClick={() => startCollection(true)}
                    loading={collecting}
                    disabled={!hasPermission('collect_data_mart')}
                    style={!hasPermission('collect_data_mart') ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                  >
                    재개
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    icon={hasPermission('collect_data_mart') ? <PlayCircleOutlined /> : <LockOutlined />}
                    onClick={() => startCollection(false)}
                    loading={collecting}
                    disabled={!hasPermission('collect_data_mart')}
                    style={!hasPermission('collect_data_mart') ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                  >
                    시작
                  </Button>
                )}
              </>
            ) : (
              <Button 
                danger
                icon={hasPermission('collect_data_mart') ? <StopOutlined /> : <LockOutlined />}
                onClick={stopCollection}
                disabled={!hasPermission('collect_data_mart')}
                style={!hasPermission('collect_data_mart') ? { background: '#722ed1', borderColor: '#722ed1', color: '#fff' } : {}}
              >
                중단
              </Button>
            )}
            {status?.is_running && (
              <Button 
                icon={hasPermission('collect_data_mart') ? <StopOutlined /> : <LockOutlined />}
                onClick={stopMonitoring}
                disabled={!hasPermission('collect_data_mart')}
                style={!hasPermission('collect_data_mart') ? { color: '#722ed1', borderColor: '#722ed1' } : {}}
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
              <Text strong>진행률</Text>
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
            </div>
          </div>

          {/* 현재 작업 정보 */}
          {status.is_running && status.current_investor_name && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '6px' 
            }}>
              <Text style={{ color: '#1890ff' }}>
                <SyncOutlined spin={status.is_running} /> 처리 중: {status.current_investor_name}
              </Text>
            </div>
          )}

          {/* 통계 정보 */}
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="처리된 투자사"
                value={status.processed_investors}
                suffix={`/ ${status.total_investors}`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
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
                <CheckCircleOutlined /> 데이터 마트 수집이 완료되었습니다!
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
                이전 작업이 중단되었습니다. "재개" 버튼을 눌러 이어서 진행할 수 있습니다.
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default DataMartCollectionProgress;

