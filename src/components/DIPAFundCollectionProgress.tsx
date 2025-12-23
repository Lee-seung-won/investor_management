import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, message, Space, Typography, Row, Col, Statistic, Spin, Tag } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { dipaFundCollectionAPI } from '../services/api.ts';
import { usePermissions } from '../utils/permissions';

const { Text } = Typography;

interface DIPACollectionStatus {
  is_running: boolean;
  progress: number;
  total_investors: number;
  processed_investors: number;
  updated_funds: number;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
  current_investor_index: number;
  current_investor_name: string | null;
  can_resume: boolean;
}

const DIPAFundCollectionProgress: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [status, setStatus] = useState<DIPACollectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await dipaFundCollectionAPI.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('DIPA 펀드 정보 수집 상태 조회 실패:', error);
    }
  };

  const startCollection = async (resume: boolean = false) => {
    if (!hasPermission('collect_dipa_fund_info')) {
      message.warning('DIPA 펀드 정보 수집 권한이 없습니다.');
      return;
    }
    try {
      setCollecting(true);
      const response = await dipaFundCollectionAPI.startCollection(resume);
      
      if (response.data.status === 'running') {
        message.warning('DIPA 펀드 정보 수집이 이미 진행 중입니다.');
      } else {
        message.success(response.data.message);
        setPolling(true);
      }
    } catch (error) {
      message.error('DIPA 펀드 정보 수집 시작에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  };

  const stopCollection = async () => {
    if (!hasPermission('collect_dipa_fund_info')) {
      message.warning('DIPA 펀드 정보 수집 권한이 없습니다.');
      return;
    }
    try {
      const response = await dipaFundCollectionAPI.stopCollection();
      message.success(response.data.message);
      setPolling(false);
    } catch (error) {
      message.error('DIPA 펀드 정보 수집 중단에 실패했습니다.');
    }
  };

  const stopMonitoring = () => {
    if (!hasPermission('collect_dipa_fund_info')) {
      message.warning('DIPA 펀드 정보 수집 권한이 없습니다.');
      return;
    }
    setPolling(false);
    message.info('수집 상태 모니터링을 중지했습니다.');
  };

  const refreshStatus = async () => {
    if (!hasPermission('collect_dipa_fund_info')) {
      message.warning('DIPA 펀드 정보 수집 권한이 없습니다.');
      return;
    }
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
          <span>펀드결성금액정보 수집 상태</span>
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={hasPermission('collect_dipa_fund_info') ? <ReloadOutlined /> : <LockOutlined />}
            onClick={refreshStatus}
            loading={loading}
            disabled={!hasPermission('collect_dipa_fund_info')}
            style={!hasPermission('collect_dipa_fund_info') ? { color: '#722ed1', borderColor: '#722ed1' } : {}}
          >
            새로고침
          </Button>
          <Space>
            {!status?.is_running ? (
              <>
                {status?.can_resume ? (
                  <Button 
                    type="primary" 
                    icon={hasPermission('collect_dipa_fund_info') ? <PlayCircleOutlined /> : <LockOutlined />}
                    onClick={() => startCollection(true)}
                    loading={collecting}
                    disabled={!hasPermission('collect_dipa_fund_info')}
                    style={!hasPermission('collect_dipa_fund_info') ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                  >
                    수집 재개
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    icon={hasPermission('collect_dipa_fund_info') ? <PlayCircleOutlined /> : <LockOutlined />}
                    onClick={() => startCollection(false)}
                    loading={collecting}
                    disabled={!hasPermission('collect_dipa_fund_info')}
                    style={!hasPermission('collect_dipa_fund_info') ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                  >
                    수집 시작
                  </Button>
                )}
              </>
            ) : (
              <Button 
                danger
                icon={hasPermission('collect_dipa_fund_info') ? <StopOutlined /> : <LockOutlined />}
                onClick={stopCollection}
                disabled={!hasPermission('collect_dipa_fund_info')}
                style={!hasPermission('collect_dipa_fund_info') ? { background: '#722ed1', borderColor: '#722ed1', color: '#fff' } : {}}
              >
                수집 중단
              </Button>
            )}
            {status?.is_running && (
              <Button 
                icon={hasPermission('collect_dipa_fund_info') ? <StopOutlined /> : <LockOutlined />}
                onClick={stopMonitoring}
                disabled={!hasPermission('collect_dipa_fund_info')}
                style={!hasPermission('collect_dipa_fund_info') ? { color: '#722ed1', borderColor: '#722ed1' } : {}}
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
                {status.updated_funds}개 펀드 업데이트
              </Text>
            </div>
          </div>

          {/* 현재 처리 중인 투자사 */}
          {status.is_running && status.current_investor_name && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
              <Text type="secondary">현재 처리 중: </Text>
              <Text strong style={{ color: '#1890ff' }}>
                {status.current_investor_name}
              </Text>
            </div>
          )}

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
                title="업데이트된 펀드"
                value={status.updated_funds}
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
                <CheckCircleOutlined /> 펀드결성금액정보 수집이 완료되었습니다!
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

export default DIPAFundCollectionProgress;
