import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, message, Space, Typography, Row, Col, Statistic, Spin, Tag, Table, Modal, Descriptions, Divider } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import { profileManagementAPI } from '../services/api.ts';

const { Text } = Typography;

interface DetectionStatus {
  is_running: boolean;
  current_phase: string | null;  // "detecting" or "processing"
  current_investor_id: number | null;
  current_investor_name: string | null;
  total_investors: number;
  processed_investors: number;
  changed_investors: Array<{
    id: number;
    name: string;
    updated_at: string;
    old_profile?: {
      description?: string;
      profile_text?: string;
      sectors?: string[];
      stage?: string[];
      one_line_intro?: string;
      program_details?: string;
      portfolio_companies?: string[];
      team_members?: string[];
    };
    new_profile?: {
      description?: string;
      profile_text?: string;
      sectors?: string[];
      stage?: string[];
      one_line_intro?: string;
      program_details?: string;
      portfolio_companies?: string[];
      team_members?: string[];
    };
  }>;
  progress: number;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
  can_resume: boolean;
}

interface ProfileDiff {
  old_profile: {
    description?: string;
    profile_text?: string;
    sectors?: string[];
    stage?: string[];
    one_line_intro?: string;
    program_details?: string;
    portfolio_companies?: string[];
    team_members?: string[];
  };
  new_profile: {
    description?: string;
    profile_text?: string;
    sectors?: string[];
    stage?: string[];
    one_line_intro?: string;
    program_details?: string;
    portfolio_companies?: string[];
    team_members?: string[];
  };
}

const ProfileChangeDetectorProgress: React.FC = () => {
  const [status, setStatus] = useState<DetectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [diffModalVisible, setDiffModalVisible] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<{ investor: any; diff: ProfileDiff } | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await profileManagementAPI.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('상태 조회 실패:', error);
    }
  };

  const startDetection = async (resume: boolean = false) => {
    try {
      setDetecting(true);
      const response = await profileManagementAPI.startDetection(resume);
      
      if (response.data.status === 'running') {
        message.warning('변경 감지가 이미 진행 중입니다.');
      } else {
        message.success(response.data.message);
        setPolling(true);
      }
    } catch (error) {
      message.error('변경 감지 시작에 실패했습니다.');
    } finally {
      setDetecting(false);
    }
  };

  const stopDetection = async () => {
    try {
      const response = await profileManagementAPI.stopDetection();
      message.success(response.data.message);
      setPolling(false);
    } catch (error) {
      message.error('변경 감지 중단에 실패했습니다.');
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
    if (status?.is_running) {
      if (status.current_phase === 'detecting') return '변경 감지 중';
      if (status.current_phase === 'processing') return '프로필 생성 중';
      return '처리 중';
    }
    if (status?.progress === 100) return '완료';
    return '대기 중';
  };

  const getPhaseText = () => {
    if (!status?.is_running) return null;
    if (status.current_phase === 'detecting' && status.current_investor_name) {
      return `변경 감지 중: ${status.current_investor_name}`;
    }
    if (status.current_phase === 'processing' && status.current_investor_name) {
      return `프로필 생성 중: ${status.current_investor_name}`;
    }
    return null;
  };

  const showProfileDiff = (investor: any) => {
    if (investor.old_profile && investor.new_profile) {
      setSelectedDiff({
        investor: investor,
        diff: {
          old_profile: investor.old_profile,
          new_profile: investor.new_profile
        }
      });
      setDiffModalVisible(true);
    } else {
      message.info('프로필 비교 정보가 없습니다.');
    }
  };

  const changedInvestorsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '투자사명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '업데이트 시간',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text: string) => formatTime(text),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showProfileDiff(record)}
          disabled={!record.old_profile || !record.new_profile}
        >
          비교 보기
        </Button>
      ),
    },
  ];

  return (
    <Card 
      title={
        <Space>
          {getStatusIcon()}
          <span>프로필 변경 감지기</span>
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
                    icon={<PlayCircleOutlined />}
                    onClick={() => startDetection(true)}
                    loading={detecting}
                  >
                    재개
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => startDetection(false)}
                    loading={detecting}
                  >
                    시작
                  </Button>
                )}
              </>
            ) : (
              <Button 
                danger
                icon={<StopOutlined />}
                onClick={stopDetection}
              >
                중단
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
              <Text type="secondary">
                {status.changed_investors.length}개 투자사 프로필 변경
              </Text>
            </div>
          </div>

          {/* 현재 작업 정보 */}
          {getPhaseText() && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '6px' 
            }}>
              <Text style={{ color: '#1890ff' }}>
                <SyncOutlined spin={status.is_running} /> {getPhaseText()}
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
                title="변경된 투자사"
                value={status.changed_investors.length}
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
                <CheckCircleOutlined /> 변경 감지가 완료되었습니다!
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

          {/* 변경된 투자사 목록 */}
          {status.changed_investors && status.changed_investors.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                변경된 투자사 목록 ({status.changed_investors.length}개)
              </Text>
              <Table
                columns={changedInvestorsColumns}
                dataSource={status.changed_investors}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `총 ${total}개`,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* 프로필 비교 모달 */}
      <Modal
        title={`프로필 변경 내역: ${selectedDiff?.investor?.name || ''}`}
        open={diffModalVisible}
        onCancel={() => {
          setDiffModalVisible(false);
          setSelectedDiff(null);
        }}
        footer={null}
        width={1000}
      >
        {selectedDiff && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title={<span style={{ color: '#ff4d4f' }}>이전 프로필</span>} size="small">
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="요약">
                      <Text>{selectedDiff.diff.old_profile.description || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="한 줄 소개">
                      <Text>{selectedDiff.diff.old_profile.one_line_intro || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="투자 섹터">
                      {selectedDiff.diff.old_profile.sectors && selectedDiff.diff.old_profile.sectors.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.old_profile.sectors.map((sector: string, idx: number) => (
                            <Tag key={idx}>{sector}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="투자 단계">
                      {selectedDiff.diff.old_profile.stage && selectedDiff.diff.old_profile.stage.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.old_profile.stage.map((s: string, idx: number) => (
                            <Tag key={idx}>{s}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="프로그램 상세">
                      <Text>{selectedDiff.diff.old_profile.program_details || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="포트폴리오 기업">
                      {selectedDiff.diff.old_profile.portfolio_companies && selectedDiff.diff.old_profile.portfolio_companies.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.old_profile.portfolio_companies.map((company: string, idx: number) => (
                            <Tag key={idx}>{company}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="프로필 텍스트">
                      <div style={{ maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                        <Text>{selectedDiff.diff.old_profile.profile_text || '-'}</Text>
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<span style={{ color: '#52c41a' }}>새 프로필</span>} size="small">
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="요약">
                      <Text>{selectedDiff.diff.new_profile.description || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="한 줄 소개">
                      <Text>{selectedDiff.diff.new_profile.one_line_intro || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="투자 섹터">
                      {selectedDiff.diff.new_profile.sectors && selectedDiff.diff.new_profile.sectors.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.new_profile.sectors.map((sector: string, idx: number) => (
                            <Tag key={idx} color="green">{sector}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="투자 단계">
                      {selectedDiff.diff.new_profile.stage && selectedDiff.diff.new_profile.stage.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.new_profile.stage.map((s: string, idx: number) => (
                            <Tag key={idx} color="green">{s}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="프로그램 상세">
                      <Text>{selectedDiff.diff.new_profile.program_details || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="포트폴리오 기업">
                      {selectedDiff.diff.new_profile.portfolio_companies && selectedDiff.diff.new_profile.portfolio_companies.length > 0 ? (
                        <Space wrap>
                          {selectedDiff.diff.new_profile.portfolio_companies.map((company: string, idx: number) => (
                            <Tag key={idx} color="green">{company}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="프로필 텍스트">
                      <div style={{ maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                        <Text>{selectedDiff.diff.new_profile.profile_text || '-'}</Text>
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ProfileChangeDetectorProgress;

